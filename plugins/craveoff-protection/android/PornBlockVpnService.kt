package __PACKAGE__.craveoff

import android.app.Service
import android.content.Intent
import android.net.VpnService
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.ParcelFileDescriptor
import android.util.Log
import okhttp3.Dns
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.InetAddress
import java.nio.ByteBuffer
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import kotlin.concurrent.thread

class PornBlockVpnService : VpnService() {

	private val TAG = "CraveOffVPN"

	companion object {
		@Volatile private var running: Boolean = false
		@Volatile private var dohEndpoint: String = "__DOH_ENDPOINT__"
		// DNS-only mode (no full-tunnel)

		private val blocklistSet: MutableSet<String> = java.util.Collections.synchronizedSet(LinkedHashSet())
		// No DoH IP blocking in DNS-only mode

		fun isRunning(): Boolean = running
		fun blocklistSize(): Int = blocklistSet.size
		fun updateBlocklist(newSet: Set<String>) {
			synchronized(blocklistSet) {
				blocklistSet.clear()
				blocklistSet.addAll(newSet.map { it.trim().lowercase() }.filter { it.isNotEmpty() })
			}
		}
		fun mode(): String = "dns-only"
		fun isBlocked(host: String): Boolean {
			val h = host.lowercase().trim('.')
			synchronized(blocklistSet) {
				if (blocklistSet.contains(h)) return true
				var idx = h.indexOf('.')
				while (idx >= 0 && idx < h.length - 1) {
					val sub = h.substring(idx + 1)
					if (blocklistSet.contains(sub)) return true
					idx = h.indexOf('.', idx + 1)
				}
			}
			return false
		}
	}

	private var tunInterface: ParcelFileDescriptor? = null
	@Volatile private var workerThread: Thread? = null
	private val client: OkHttpClient by lazy {
		OkHttpClient.Builder()
			// Avoid DNS bootstrap recursion by resolving DoH host to known IPs
			.dns(object : Dns {
				override fun lookup(hostname: String): List<InetAddress> {
					return if (hostname.equals("cloudflare-dns.com", ignoreCase = true)) {
						listOf(
							// IPv4
							InetAddress.getByName("1.1.1.1"),
							InetAddress.getByName("1.0.0.1"),
							// IPv6
							InetAddress.getByName("2606:4700:4700::1111"),
							InetAddress.getByName("2606:4700:4700::1001")
						)
					} else {
						Dns.SYSTEM.lookup(hostname)
					}
				}
			})
			.connectTimeout(5, TimeUnit.SECONDS)
			.readTimeout(5, TimeUnit.SECONDS)
			.build()
	}

	private val DNS_SERVER_V4 = "10.0.0.1"
	private val DNS_SERVER_V6 = "fd00::1"
	private val LOCAL_TUN_V4 = "10.0.0.2"
	private val LOCAL_TUN_V6 = "fd00::2"

	private data class SafeCacheEntry(
		val expiresAtMs: Long,
		val v4: List<ByteArray>,
		val v6: List<ByteArray>
	)
	private val safeCache: MutableMap<String, SafeCacheEntry> = ConcurrentHashMap()
	private val SAFE_TTL_MS = TimeUnit.MINUTES.toMillis(5)

	override fun onCreate() {
		super.onCreate()
		NotificationUtils.ensureChannel(this)
		val notif = NotificationUtils.buildForegroundNotification(this, false)
		if (Build.VERSION.SDK_INT >= 29) {
			startForeground(1001, notif, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
		} else {
			@Suppress("DEPRECATION")
			startForeground(1001, notif)
		}
	}

	override fun onDestroy() {
		stopWorker()
		// Ensure foreground notification is removed when service stops
		if (Build.VERSION.SDK_INT >= 24) {
			try { stopForeground(STOP_FOREGROUND_REMOVE) } catch (_: Throwable) {}
		} else {
			@Suppress("DEPRECATION")
			try { stopForeground(true) } catch (_: Throwable) {}
		}
		try { ProtectionHealthWorker.cancel(this) } catch (_: Throwable) {}
		broadcastProtectionOff()
		super.onDestroy()
	}

	override fun onRevoke() {
		stopWorker()
		broadcastProtectionOff()
		super.onRevoke()
	}

	override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
		when (intent?.action) {
			CraveOffProtectionModule.ACTION_START -> startWorker()
			CraveOffProtectionModule.ACTION_STOP -> stopSelfSafely()
			CraveOffProtectionModule.ACTION_APPLY_BLOCKLIST -> { /* blocklist already updated via static setter */ }
			else -> { /* no-op */ }
		}
		return Service.START_STICKY
	}

	override fun onTaskRemoved(rootIntent: Intent?) {
		super.onTaskRemoved(rootIntent)
		if (!running) broadcastProtectionOff()
	}

	private fun stopSelfSafely() {
		stopWorker()
		if (Build.VERSION.SDK_INT >= 24) {
			stopForeground(STOP_FOREGROUND_REMOVE)
		} else {
			@Suppress("DEPRECATION")
			stopForeground(true)
		}
		stopSelf()
	}

	private fun startWorker() {
		if (running) return
		setupTun()
		running = true
		val runningNotif = NotificationUtils.buildForegroundNotification(this, true)
		if (Build.VERSION.SDK_INT >= 29) {
			startForeground(1001, runningNotif, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
		} else {
			@Suppress("DEPRECATION")
			startForeground(1001, runningNotif)
		}
		Log.i(TAG, "VPN worker thread started")
		val thread = thread(name = "CraveOffVpnWorker", isDaemon = true) {
			try {
				processLoop()
			} catch (e: Throwable) {
				Log.e(TAG, "VPN worker error", e)
			} finally {
				running = false
				Log.i(TAG, "VPN worker thread stopped")
			}
		}
		workerThread = thread
	}

	private fun stopWorker() {
		running = false
		Log.i(TAG, "Stopping VPN worker")
		try { tunInterface?.close() } catch (_: Throwable) {}
		tunInterface = null
		workerThread?.interrupt()
		workerThread = null
	}

	private fun setupTun() {
		val builder = Builder()
			.setSession("CraveOff Protection")
			.addAddress(LOCAL_TUN_V4, 32)
			.addDnsServer(DNS_SERVER_V4)
			.addRoute(DNS_SERVER_V4, 32) // route only DNS server traffic via VPN
			// IPv6 local DNS
			.addAddress(LOCAL_TUN_V6, 128)
			.addDnsServer(DNS_SERVER_V6)
			.addRoute(DNS_SERVER_V6, 128)
		// On Android 10+ we can set meterred etc., but not required
		tunInterface?.close()
		tunInterface = builder.establish()
		Log.i(TAG, "TUN interface established: DNS_V4=$DNS_SERVER_V4 DNS_V6=$DNS_SERVER_V6 mode=dns-only")
	}

	private fun processLoop() {
		val pfd = tunInterface ?: return
		val `in` = FileInputStream(pfd.fileDescriptor)
		val out = FileOutputStream(pfd.fileDescriptor)
		val packet = ByteArray(32767)
		while (running) {
			val length = try { `in`.read(packet) } catch (_: Throwable) { -1 }
			if (length <= 0) continue
			// Minimal handling for IPv4/IPv6
			val version = (packet[0].toInt() shr 4)
			if (version == 4) {
				val totalLen = ((packet[2].toInt() and 0xFF) shl 8) or (packet[3].toInt() and 0xFF)
				val ihl = (packet[0].toInt() and 0x0F) * 4
				if (totalLen < ihl + 8) continue
				val proto = packet[9].toInt() and 0xFF
				val dstIp = InetAddress.getByAddress(byteArrayOf(packet[16], packet[17], packet[18], packet[19]))
				val srcIp = InetAddress.getByAddress(byteArrayOf(packet[12], packet[13], packet[14], packet[15]))
				// DNS over UDP to our local DNS
				if (proto != 17) {
					Log.v(TAG, "IPv4 packet: proto=$proto (not UDP), skipping")
					continue
				}
				if (dstIp.hostAddress != DNS_SERVER_V4) {
					Log.v(TAG, "IPv4 UDP packet: dst=${dstIp.hostAddress} (not $DNS_SERVER_V4), skipping")
					continue
				}
				val srcPort = (((packet[ihl].toInt() and 0xFF) shl 8) or (packet[ihl + 1].toInt() and 0xFF))
				val dstPort = (((packet[ihl + 2].toInt() and 0xFF) shl 8) or (packet[ihl + 3].toInt() and 0xFF))
				if (dstPort != 53) continue
				val udpLen = ((packet[ihl + 4].toInt() and 0xFF) shl 8) or (packet[ihl + 5].toInt() and 0xFF)
				val dnsOffset = ihl + 8
				val dnsLen = udpLen - 8
				if (dnsOffset + dnsLen > length) continue
				val dnsQuery = packet.copyOfRange(dnsOffset, dnsOffset + dnsLen)
				val qname = try { parseQueryName(dnsQuery) } catch (_: Throwable) { null }
				Log.i(TAG, "IPv4 DNS query: host=$qname from=${srcIp.hostAddress}:$srcPort -> $DNS_SERVER_V4:53")
				val replyPayload: ByteArray = try {
					if (qname != null && isBlocked(qname)) {
						Log.i(TAG, "IPv4 DNS BLOCKED: $qname (from ${srcIp.hostAddress})")
						buildBlockedDnsResponse(dnsQuery)
					} else {
						val qtype = readQType(dnsQuery)
						val safe = if (qname != null) resolveSafeSearchResponse(qname, qtype, dnsQuery) else null
						if (safe != null) {
							Log.d(TAG, "IPv4 DNS SAFESEARCH/RESOLVED: $qname (from ${srcIp.hostAddress})")
						} else {
							Log.d(TAG, "IPv4 DNS FORWARD: $qname -> DoH (from ${srcIp.hostAddress})")
						}
						if (safe != null) safe else forwardDnsOverHttps(dnsQuery)
					}
				} catch (e: Throwable) {
					Log.w(TAG, "IPv4 DNS error for $qname: ${e.message} -> SERVFAIL")
					buildServfailResponse(dnsQuery)
				}
				val response = buildIpv4UdpPacket(
					src = byteArrayOf(packet[16], packet[17], packet[18], packet[19]),
					dst = byteArrayOf(packet[12], packet[13], packet[14], packet[15]),
					srcPort = 53,
					dstPort = srcPort,
					payload = replyPayload
				)
				try { out.write(response) } catch (_: Throwable) {}
			} else if (version == 6) {
				// IPv6 minimal UDP parser for DNS to fd00::1:53 (no extension headers handled)
				if (length < 48) {
					Log.v(TAG, "IPv6 packet too short: $length bytes")
					continue
				}
				val nextHeader = packet[6].toInt() and 0xFF
				val dst = packet.copyOfRange(24, 40)
				val dstIp = InetAddress.getByAddress(dst)
				if (nextHeader != 17) {
					Log.v(TAG, "IPv6 packet: nextHeader=$nextHeader (not UDP), skipping")
					continue
				}
				val payloadLen = ((packet[4].toInt() and 0xFF) shl 8) or (packet[5].toInt() and 0xFF)
				if (payloadLen < 8) continue
				val src = packet.copyOfRange(8, 24)
				if (dstIp.hostAddress.lowercase() != DNS_SERVER_V6) {
					Log.v(TAG, "IPv6 UDP packet: dst=${dstIp.hostAddress} (not $DNS_SERVER_V6), skipping")
					continue
				}
				val udpOffset = 40
				val srcPort = (((packet[udpOffset].toInt() and 0xFF) shl 8) or (packet[udpOffset + 1].toInt() and 0xFF))
				val dstPort = (((packet[udpOffset + 2].toInt() and 0xFF) shl 8) or (packet[udpOffset + 3].toInt() and 0xFF))
				if (dstPort != 53) {
					Log.v(TAG, "IPv6 UDP packet: dstPort=$dstPort (not 53), skipping")
					continue
				}
				val udpLen = ((packet[udpOffset + 4].toInt() and 0xFF) shl 8) or (packet[udpOffset + 5].toInt() and 0xFF)
				val dnsOffset = udpOffset + 8
				val dnsLen = udpLen - 8
				if (dnsOffset + dnsLen > length) continue
				val dnsQuery = packet.copyOfRange(dnsOffset, dnsOffset + dnsLen)
				val qname = try { parseQueryName(dnsQuery) } catch (_: Throwable) { null }
				val srcIpStr = try { InetAddress.getByAddress(src).hostAddress } catch (_: Throwable) { "unknown" }
				Log.i(TAG, "IPv6 DNS query: host=$qname from=$srcIpStr:$srcPort -> $DNS_SERVER_V6:53")
				val replyPayload: ByteArray = try {
					if (qname != null && isBlocked(qname)) {
						Log.i(TAG, "IPv6 DNS BLOCKED: $qname (from $srcIpStr)")
						buildBlockedDnsResponse(dnsQuery)
					} else {
						val qtype = readQType(dnsQuery)
						val safe = if (qname != null) resolveSafeSearchResponse(qname, qtype, dnsQuery) else null
						if (safe != null) {
							Log.d(TAG, "IPv6 DNS SAFESEARCH/RESOLVED: $qname (from $srcIpStr)")
						} else {
							Log.d(TAG, "IPv6 DNS FORWARD: $qname -> DoH (from $srcIpStr)")
						}
						if (safe != null) safe else forwardDnsOverHttps(dnsQuery)
					}
				} catch (e: Throwable) {
					Log.w(TAG, "IPv6 DNS error for $qname: ${e.message} -> SERVFAIL")
					buildServfailResponse(dnsQuery)
				}
				val response = buildIpv6UdpPacket(
					src = dst,
					dst = src,
					srcPort = 53,
					dstPort = srcPort,
					payload = replyPayload
				)
				try { out.write(response) } catch (_: Throwable) {}
			}
		}
	}

	// No fallback needed in DNS-only mode

	private fun broadcastProtectionOff() {
		try {
			val intent = Intent("CRAVEOFF_PROTECTION_OFF").apply {
				// Restrict to own app to satisfy Android 13/14 implicit broadcast policies
				setPackage(packageName)
			}
			sendBroadcast(intent)
		} catch (_: Throwable) {}
	}

	private fun isBlocked(qname: String): Boolean {
		val host = qname.lowercase().trim('.')
		synchronized(blocklistSet) {
			if (blocklistSet.contains(host)) return true
			// suffix match
			var idx = host.indexOf('.')
			while (idx >= 0 && idx < host.length - 1) {
				val sub = host.substring(idx + 1)
				if (blocklistSet.contains(sub)) return true
				idx = host.indexOf('.', idx + 1)
			}
		}
		return false
	}

	private fun parseQueryName(dns: ByteArray): String {
		// DNS header 12 bytes; then QNAME
		var i = 12
		val labels = ArrayList<String>()
		while (i < dns.size) {
			val len = dns[i].toInt() and 0xFF
			if (len == 0) { i++; break }
			if (i + 1 + len > dns.size) break
			val label = String(dns, i + 1, len, Charsets.ISO_8859_1)
			labels.add(label)
			i += 1 + len
		}
		return labels.joinToString(".")
	}

	private fun buildBlockedDnsResponse(query: ByteArray): ByteArray {
		// Echo header with QR=1, RD preserved, RCODE=0
		val idHigh = query[0]
		val idLow = query[1]
		val flags1 = query[2].toInt() and 0xFF
		val rd = flags1 and 0x01
		val header = ByteArray(12)
		header[0] = idHigh
		header[1] = idLow
		header[2] = ((1 shl 7) or rd).toByte() // QR=1, RD as in query
		header[3] = 0 // RA=0, RCODE=0
		// QDCOUNT=1, ANCOUNT=1, NSCOUNT=0, ARCOUNT=0
		header[4] = 0; header[5] = 1
		header[6] = 0; header[7] = 1
		header[8] = 0; header[9] = 0
		header[10] = 0; header[11] = 0
		// Copy question
		val questionLen = questionLength(query)
		val question = query.copyOfRange(12, 12 + questionLen)
		// Determine QTYPE
		val qtype = readQType(query)
		// Build RR
		val rr = if (qtype == 1) { // A
			val buf = ByteBuffer.allocate(2 + 2 + 2 + 4 + 2 + 4)
			buf.put(0xC0.toByte())
			buf.put(0x0C.toByte())
			buf.putShort(1) // TYPE A
			buf.putShort(1) // CLASS IN
			buf.putInt(60) // TTL
			buf.putShort(4) // RDLENGTH
			buf.put(byteArrayOf(0, 0, 0, 0)) // 0.0.0.0
			buf.array()
		} else if (qtype == 28) { // AAAA
			val buf = ByteBuffer.allocate(2 + 2 + 2 + 4 + 2 + 16)
			buf.put(0xC0.toByte())
			buf.put(0x0C.toByte())
			buf.putShort(28) // TYPE AAAA
			buf.putShort(1) // CLASS IN
			buf.putInt(60) // TTL
			buf.putShort(16) // RDLENGTH
			buf.put(ByteArray(16) { 0 }) // ::
			buf.array()
		} else {
			// For other types, return SERVFAIL to avoid leaking info
			return buildServfailResponse(query)
		}
		return header + question + rr
	}

	private enum class SafeTarget(val host: String) {
		GOOGLE("forcesafesearch.google.com"),
		BING("strict.bing.com"),
		DDG("safe.duckduckgo.com");
		companion object {
			fun match(host: String): SafeTarget? {
				val h = host.lowercase()
				return when {
					h == "google" -> GOOGLE // unlikely
					h.endsWith(".google") || h.endsWith(".google.com") || h.contains(".google.") || h == "google.com" -> GOOGLE
					h == "bing.com" || h.endsWith(".bing.com") -> BING
					h == "duckduckgo.com" || h.endsWith(".duckduckgo.com") -> DDG
					else -> null
				}
			}
		}
	}

	private fun resolveSafeSearchResponse(qname: String, qtype: Int, originalQuery: ByteArray): ByteArray? {
		val target = SafeTarget.match(qname) ?: return null
		val ips = getSafeIps(target.host)
		val addrs = if (qtype == 1) ips.v4 else if (qtype == 28) ips.v6 else emptyList()
		if (addrs.isEmpty()) return null
		return buildIpAnswerResponse(originalQuery, qtype, addrs)
	}

	private fun getSafeIps(host: String): SafeCacheEntry {
		val now = System.currentTimeMillis()
		val cached = safeCache[host]
		if (cached != null && cached.expiresAtMs > now) return cached
		// refresh via DoH
		val v4 = resolveHostOverDoh(host, 1)
		val v6 = resolveHostOverDoh(host, 28)
		val entry = SafeCacheEntry(now + SAFE_TTL_MS, v4, v6)
		safeCache[host] = entry
		return entry
	}

	private fun resolveHostOverDoh(host: String, qtype: Int): List<ByteArray> {
		return try {
			val query = buildDnsQuery(host, qtype)
			val resp = forwardDnsOverHttps(query)
			parseAorAAAAFromResponse(resp, qtype)
		} catch (_: Throwable) {
			emptyList()
		}
	}

	private fun buildDnsQuery(host: String, qtype: Int): ByteArray {
		val labels = host.trim('.').split(".")
		val qnameLen = labels.sumOf { 1 + it.length } + 1
		val buf = ByteBuffer.allocate(12 + qnameLen + 4)
		// ID
		buf.put(0x12)
		buf.put(0x34)
		// Flags: RD=1
		buf.put(0x01)
		buf.put(0x00)
		// QDCOUNT=1
		buf.put(0x00); buf.put(0x01)
		// ANCOUNT/NS/AR = 0
		buf.put(0x00); buf.put(0x00)
		buf.put(0x00); buf.put(0x00)
		buf.put(0x00); buf.put(0x00)
		for (label in labels) {
			val bytes = label.toByteArray(Charsets.ISO_8859_1)
			buf.put(bytes.size.toByte())
			buf.put(bytes)
		}
		buf.put(0x00) // end
		buf.putShort(qtype.toShort()) // QTYPE
		buf.putShort(1) // QCLASS IN
		return buf.array()
	}

	private fun parseAorAAAAFromResponse(resp: ByteArray, qtype: Int): List<ByteArray> {
		if (resp.size < 12) return emptyList()
		val ancount = ((resp[6].toInt() and 0xFF) shl 8) or (resp[7].toInt() and 0xFF)
		var offset = 12 + questionLength(resp)
		val out = ArrayList<ByteArray>()
		for (i in 0 until ancount) {
			if (offset + 12 > resp.size) break
			// NAME (2 bytes pointer or label), TYPE(2), CLASS(2), TTL(4), RDLEN(2), RDATA
			// Skip NAME (2 if pointer, else walk labels). Assume pointer for simplicity.
			val nameByte = resp[offset].toInt() and 0xFF
			offset += if ((nameByte and 0xC0) == 0xC0) 2 else run {
				// walk labels
				var j = offset
				while (j < resp.size) {
					val l = resp[j].toInt() and 0xFF
					j++
					if (l == 0) break
					j += l
				}
				j - offset + 1
			}
			if (offset + 10 > resp.size) break
			val type = ((resp[offset].toInt() and 0xFF) shl 8) or (resp[offset + 1].toInt() and 0xFF)
			offset += 2
			val clazz = ((resp[offset].toInt() and 0xFF) shl 8) or (resp[offset + 1].toInt() and 0xFF)
			offset += 2
			offset += 4 // TTL
			val rdlen = ((resp[offset].toInt() and 0xFF) shl 8) or (resp[offset + 1].toInt() and 0xFF)
			offset += 2
			if (offset + rdlen > resp.size) break
			if (clazz == 1 && type == qtype) {
				if (qtype == 1 && rdlen == 4) {
					out.add(resp.copyOfRange(offset, offset + 4))
				} else if (qtype == 28 && rdlen == 16) {
					out.add(resp.copyOfRange(offset, offset + 16))
				}
			}
			offset += rdlen
		}
		return out
	}

	private fun buildIpAnswerResponse(query: ByteArray, qtype: Int, addrs: List<ByteArray>): ByteArray {
		val idHigh = query[0]
		val idLow = query[1]
		val flags1 = query[2].toInt() and 0xFF
		val rd = flags1 and 0x01
		val header = ByteArray(12)
		header[0] = idHigh
		header[1] = idLow
		header[2] = ((1 shl 7) or rd).toByte() // QR=1
		header[3] = 0 // NOERROR
		header[4] = 0; header[5] = 1 // QD=1
		// AN=addrs.size
		header[6] = ((addrs.size shr 8) and 0xFF).toByte()
		header[7] = (addrs.size and 0xFF).toByte()
		header[8] = 0; header[9] = 0
		header[10] = 0; header[11] = 0
		val questionLen = questionLength(query)
		val question = query.copyOfRange(12, 12 + questionLen)
		val answers = ArrayList<ByteArray>()
		for (addr in addrs) {
			val rdlen = if (qtype == 1) 4 else 16
			val buf = ByteBuffer.allocate(2 + 2 + 2 + 4 + 2 + rdlen)
			buf.put(0xC0.toByte()); buf.put(0x0C.toByte()) // pointer to question
			buf.putShort(qtype.toShort())
			buf.putShort(1) // IN
			buf.putInt(300) // TTL
			buf.putShort(rdlen.toShort())
			buf.put(addr)
			answers.add(buf.array())
		}
		var total = header + question
		for (a in answers) total += a
		return total
	}

	private fun buildServfailResponse(query: ByteArray): ByteArray {
		val idHigh = query[0]
		val idLow = query[1]
		val flags1 = query[2].toInt() and 0xFF
		val rd = flags1 and 0x01
		val header = ByteArray(12)
		header[0] = idHigh
		header[1] = idLow
		header[2] = ((1 shl 7) or rd).toByte() // QR=1
		header[3] = 2 // SERVFAIL
		header[4] = 0; header[5] = 1 // QDCOUNT
		header[6] = 0; header[7] = 0 // ANCOUNT
		header[8] = 0; header[9] = 0 // NSCOUNT
		header[10] = 0; header[11] = 0 // ARCOUNT
		val questionLen = questionLength(query)
		val question = query.copyOfRange(12, 12 + questionLen)
		return header + question
	}

	private fun questionLength(query: ByteArray): Int {
		var i = 12
		while (i < query.size) {
			val len = query[i].toInt() and 0xFF
			i++
			if (len == 0) break
			i += len
		}
		// QTYPE + QCLASS
		return (i + 4) - 12
	}

	private fun readQType(query: ByteArray): Int {
		var i = 12
		while (i < query.size) {
			val len = query[i].toInt() and 0xFF
			i++
			if (len == 0) break
			i += len
		}
		if (i + 1 >= query.size) return 1
		return ((query[i].toInt() and 0xFF) shl 8) or (query[i + 1].toInt() and 0xFF)
	}

	private fun forwardDnsOverHttps(query: ByteArray): ByteArray {
		val media = "application/dns-message".toMediaType()
		val req = Request.Builder()
			.url(dohEndpoint)
			.post(RequestBody.create(media, query))
			.addHeader("accept", "application/dns-message")
			.build()
		client.newCall(req).execute().use { resp ->
			if (!resp.isSuccessful) throw RuntimeException("DoH HTTP ${resp.code}")
			val body = resp.body ?: throw RuntimeException("Empty DoH body")
			return body.bytes()
		}
	}

	private fun buildIpv4UdpPacket(
		src: ByteArray,
		dst: ByteArray,
		srcPort: Int,
		dstPort: Int,
		payload: ByteArray
	): ByteArray {
		val ihl = 20
		val udpLen = 8 + payload.size
		val totalLen = ihl + udpLen
		val buf = ByteArray(totalLen)
		// IPv4 header
		buf[0] = 0x45 // version=4, ihl=5
		buf[1] = 0 // DSCP/ECN
		buf[2] = (totalLen shr 8).toByte()
		buf[3] = (totalLen and 0xFF).toByte()
		buf[4] = 0; buf[5] = 0 // id
		buf[6] = 0x40 // flags, fragment offset high
		buf[7] = 0 // fragment offset low
		buf[8] = 64 // TTL
		buf[9] = 17 // UDP
		System.arraycopy(src, 0, buf, 12, 4)
		System.arraycopy(dst, 0, buf, 16, 4)
		// IP checksum
		val ipCsum = checksum(buf, 0, ihl)
		buf[10] = (ipCsum shr 8).toByte()
		buf[11] = (ipCsum and 0xFF).toByte()
		// UDP header
		val o = ihl
		buf[o] = (srcPort shr 8).toByte()
		buf[o + 1] = (srcPort and 0xFF).toByte()
		buf[o + 2] = (dstPort shr 8).toByte()
		buf[o + 3] = (dstPort and 0xFF).toByte()
		buf[o + 4] = (udpLen shr 8).toByte()
		buf[o + 5] = (udpLen and 0xFF).toByte()
		buf[o + 6] = 0; buf[o + 7] = 0 // checksum temp 0
		System.arraycopy(payload, 0, buf, o + 8, payload.size)
		// UDP checksum with pseudo header
		val pseudo = ByteBuffer.allocate(12 + udpLen)
		pseudo.put(src)
		pseudo.put(dst)
		pseudo.put(0)
		pseudo.put(17)
		pseudo.putShort(udpLen.toShort())
		pseudo.put(buf, o, udpLen)
		val udpCsum = checksum(pseudo.array(), 0, pseudo.position())
		buf[o + 6] = (udpCsum shr 8).toByte()
		buf[o + 7] = (udpCsum and 0xFF).toByte()
		return buf
	}

	private fun buildIpv6UdpPacket(
		src: ByteArray,
		dst: ByteArray,
		srcPort: Int,
		dstPort: Int,
		payload: ByteArray
	): ByteArray {
		val ipv6HeaderLen = 40
		val udpLen = 8 + payload.size
		val totalLen = ipv6HeaderLen + udpLen
		val buf = ByteArray(totalLen)
		// IPv6 header
		buf[0] = 0x60 // Version 6
		buf[1] = 0 // Traffic Class (high)
		buf[2] = 0 // Traffic Class (low)
		buf[3] = 0 // Flow Label (high bits)
		buf[4] = (udpLen shr 8).toByte() // Payload length
		buf[5] = (udpLen and 0xFF).toByte()
		buf[6] = 17 // Next Header = UDP
		buf[7] = 64 // Hop Limit
		System.arraycopy(src, 0, buf, 8, 16)
		System.arraycopy(dst, 0, buf, 24, 16)
		// UDP header
		val o = ipv6HeaderLen
		buf[o] = (srcPort shr 8).toByte()
		buf[o + 1] = (srcPort and 0xFF).toByte()
		buf[o + 2] = (dstPort shr 8).toByte()
		buf[o + 3] = (dstPort and 0xFF).toByte()
		buf[o + 4] = (udpLen shr 8).toByte()
		buf[o + 5] = (udpLen and 0xFF).toByte()
		buf[o + 6] = 0; buf[o + 7] = 0 // checksum temp 0
		System.arraycopy(payload, 0, buf, o + 8, payload.size)
		// UDP checksum with IPv6 pseudo header
		val pseudo = ByteBuffer.allocate(40 + udpLen)
		pseudo.put(src)
		pseudo.put(dst)
		pseudo.putInt(udpLen)
		pseudo.put(ByteArray(3) { 0 })
		pseudo.put(17.toByte())
		pseudo.put(buf, o, udpLen)
		val udpCsum = checksum(pseudo.array(), 0, pseudo.position())
		buf[o + 6] = (udpCsum shr 8).toByte()
		buf[o + 7] = (udpCsum and 0xFF).toByte()
		return buf
	}

	private fun checksum(data: ByteArray, offset: Int, length: Int): Int {
		var sum = 0L
		var i = offset
		while (i + 1 < offset + length) {
			val word = ((data[i].toInt() and 0xFF) shl 8) or (data[i + 1].toInt() and 0xFF)
			sum += word.toLong()
			if ((sum and 0xFFFF0000L) != 0L) {
				sum = (sum and 0xFFFF) + (sum shr 16)
			}
			i += 2
		}
		if (i < offset + length) {
			val word = (data[i].toInt() and 0xFF) shl 8
			sum += word.toLong()
		}
		while ((sum shr 16) != 0L) {
			sum = (sum and 0xFFFF) + (sum shr 16)
		}
		return sum.inv().toInt() and 0xFFFF
	}
}


