package __PACKAGE__.craveoff

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.VpnService
import android.os.Build
import android.Manifest
import android.content.pm.PackageManager
import android.provider.Settings
import androidx.core.content.ContextCompat
import androidx.core.app.ActivityCompat
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.DeviceEventManagerModule
import __PACKAGE__.BuildConfig

@ReactModule(name = CraveOffProtectionModule.NAME)
class CraveOffProtectionModule(private val reactCtx: ReactApplicationContext) :
	ReactContextBaseJavaModule(reactCtx), ActivityEventListener {

	companion object {
		const val NAME = "CraveOffProtection"
		private const val REQ_PREPARE_VPN = 8643

		const val ACTION_START = "ACTION_START_VPN"
		const val ACTION_STOP = "ACTION_STOP_VPN"
		const val ACTION_APPLY_BLOCKLIST = "ACTION_APPLY_BLOCKLIST"
	}

	private var pendingEnablePromise: Promise? = null
	private var protectionReceiver: BroadcastReceiver? = null

	init {
		reactCtx.addActivityEventListener(this)
	}

	override fun getName(): String = NAME

	override fun initialize() {
		super.initialize()
		// Bridge broadcast -> RN event
		val receiver = object : BroadcastReceiver() {
			override fun onReceive(context: Context?, intent: Intent?) {
				if (intent?.action == "CRAVEOFF_PROTECTION_OFF") {
					try {
						reactApplicationContext
							.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
							.emit("CraveOffProtectionEvent", Arguments.createMap().apply {
								putString("type", "PROTECTION_OFF")
							})
					} catch (_: Exception) {}
				}
			}
		}
		protectionReceiver = receiver
		val filter = IntentFilter("CRAVEOFF_PROTECTION_OFF")
		try {
			if (Build.VERSION.SDK_INT >= 33) {
				reactApplicationContext.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
			} else {
				@Suppress("DEPRECATION")
				reactApplicationContext.registerReceiver(receiver, filter)
			}
		} catch (_: Exception) {
			// Ignore registration failure to prevent hard crash on OEM-specific restrictions
		}
	}

	override fun onCatalystInstanceDestroy() {
		super.onCatalystInstanceDestroy()
		try {
			if (protectionReceiver != null) {
				reactApplicationContext.unregisterReceiver(protectionReceiver)
				protectionReceiver = null
			}
		} catch (_: Exception) {}
	}

	@ReactMethod
	fun enable(promise: Promise) {
		val appContext = reactApplicationContext
		// Android 13+: request POST_NOTIFICATIONS before starting foreground service
		if (Build.VERSION.SDK_INT >= 33) {
			val activity: Activity? = currentActivity
			val granted = ContextCompat.checkSelfPermission(appContext, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
			if (!granted && activity != null) {
				try {
					ActivityCompat.requestPermissions(activity, arrayOf(Manifest.permission.POST_NOTIFICATIONS), 9101)
				} catch (_: Exception) {}
			}
		}
		val prepareIntent = VpnService.prepare(appContext)
		if (prepareIntent != null) {
			val activity: Activity? = currentActivity
			if (activity == null) {
				promise.reject("NO_ACTIVITY", "Activity is null; cannot request VPN permission.")
				return
			}
			pendingEnablePromise = promise
			try {
				activity.startActivityForResult(prepareIntent, REQ_PREPARE_VPN)
			} catch (e: Exception) {
				pendingEnablePromise = null
				promise.reject("VPN_PREPARE_ERROR", e.message, e)
			}
		} else {
			try {
				startVpnService()
				promise.resolve(true)
			} catch (e: Exception) {
				promise.reject("VPN_START_ERROR", e.message, e)
			}
		}
	}

	private fun startVpnService() {
		val intent = Intent(reactApplicationContext, PornBlockVpnService::class.java).apply {
			action = ACTION_START
		}
		ContextCompat.startForegroundService(reactApplicationContext, intent)
		// Schedule health check worker
		ProtectionHealthWorker.schedule(reactApplicationContext)
	}

	@ReactMethod
	fun disable(promise: Promise) {
		try {
			// Cancel health checks so we don't keep broadcasting after disable
			try { ProtectionHealthWorker.cancel(reactApplicationContext) } catch (_: Exception) {}
			val intent = Intent(reactApplicationContext, PornBlockVpnService::class.java).apply {
				action = ACTION_STOP
			}
			reactApplicationContext.startService(intent)
			promise.resolve(true)
		} catch (e: Exception) {
			promise.reject("VPN_STOP_ERROR", e.message, e)
		}
	}

	@ReactMethod
	fun applyBlocklist(domains: ReadableArray, promise: Promise) {
		try {
			val items = HashSet<String>()
			for (i in 0 until domains.size()) {
				val d = domains.getString(i)?.trim()?.lowercase()
				if (!d.isNullOrEmpty()) items.add(d)
			}
			PornBlockVpnService.updateBlocklist(items)
			// Notify service if running
			val intent = Intent(reactApplicationContext, PornBlockVpnService::class.java).apply {
				action = ACTION_APPLY_BLOCKLIST
			}
			reactApplicationContext.startService(intent)
			promise.resolve(true)
		} catch (e: Exception) {
			promise.reject("BLOCKLIST_ERROR", e.message, e)
		}
	}

	@ReactMethod
	fun status(promise: Promise) {
		val map = Arguments.createMap().apply {
			putBoolean("running", PornBlockVpnService.isRunning())
			putInt("blocklistSize", PornBlockVpnService.blocklistSize())
			putString("mode", PornBlockVpnService.mode())
		}
		promise.resolve(map)
	}

	override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
		if (requestCode == REQ_PREPARE_VPN) {
			val p = pendingEnablePromise
			pendingEnablePromise = null
			if (resultCode == Activity.RESULT_OK) {
				try {
					startVpnService()
					p?.resolve(true)
				} catch (e: Exception) {
					p?.reject("VPN_START_ERROR", e.message, e)
				}
			} else {
				p?.reject("VPN_PERMISSION_DENIED", "User denied VPN permission.")
			}
		}
	}

	override fun onNewIntent(intent: Intent?) = Unit

	// RN event API compatibility (no-op, required by RN)
	@ReactMethod
	fun addListener(eventName: String) { /* no-op */ }
	@ReactMethod
	fun removeListeners(count: Int) { /* no-op */ }

	@ReactMethod
	fun openPrivateDnsSettings(promise: Promise) {
		try {
			val intent = Intent("android.settings.PRIVATE_DNS_SETTINGS")
			intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
			reactApplicationContext.startActivity(intent)
			promise.resolve(true)
		} catch (e: Exception) {
			promise.reject("OPEN_SETTINGS_ERROR", e.message, e)
		}
	}

	@ReactMethod
	fun openSystemSettings(promise: Promise) {
		try {
			val intent = Intent("android.settings.SETTINGS")
			intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
			reactApplicationContext.startActivity(intent)
			promise.resolve(true)
		} catch (e: Exception) {
			promise.reject("OPEN_SETTINGS_ERROR", e.message, e)
		}
	}

	// Debug-only util
	@ReactMethod
	fun testResolve(qname: String, promise: Promise) {
		if (!BuildConfig.DEBUG) {
			promise.reject("DISABLED", "Only available in Debug builds")
			return
		}
		val host = qname.trim().lowercase()
		when {
			PornBlockVpnService.isBlocked(host) -> promise.resolve("BLOCKED")
			else -> {
				// mirror of SafeSearch match
				val safe = try {
					val m = javaClass.classLoader
					// We can't call private enums; approximate using same logic
					host == "google.com" || host.endsWith(".google.com") || host.contains(".google.") ||
					host == "youtube.com" || host.endsWith(".youtube.com") || host == "youtu.be" ||
					host == "bing.com" || host.endsWith(".bing.com") ||
					host == "duckduckgo.com" || host.endsWith(".duckduckgo.com")
				} catch (_: Throwable) { false }
				promise.resolve(if (safe) "SAFESEARCH" else "FORWARDED")
			}
		}
	}
}


