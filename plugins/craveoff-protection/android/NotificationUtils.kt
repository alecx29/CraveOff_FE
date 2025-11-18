package __PACKAGE__.craveoff

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat

object NotificationUtils {
	const val CHANNEL_ID = "craveoff_protection_channel"
	private const val CHANNEL_NAME = "CraveOff Protection"
	private const val CHANNEL_DESC = "Foreground service for local DNS filtering"

	fun ensureChannel(context: Context) {
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
			val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
			if (nm.getNotificationChannel(CHANNEL_ID) == null) {
				val channel = NotificationChannel(
					CHANNEL_ID,
					CHANNEL_NAME,
					NotificationManager.IMPORTANCE_LOW
				).apply {
					description = CHANNEL_DESC
					setShowBadge(false)
				}
				nm.createNotificationChannel(channel)
			}
		}
	}

	fun buildForegroundNotification(context: Context, running: Boolean): Notification {
		val title = "CraveOff Protection"
		val text = if (running) "DNS filtering active" else "Starting..."
		return NotificationCompat.Builder(context, CHANNEL_ID)
			.setContentTitle(title)
			.setContentText(text)
			.setSmallIcon(android.R.drawable.stat_sys_warning)
			.setOngoing(true)
			.setOnlyAlertOnce(true)
			.build()
	}
}


