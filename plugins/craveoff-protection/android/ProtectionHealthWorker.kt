package __PACKAGE__.craveoff

import android.content.Context
import android.content.Intent
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.Worker
import androidx.work.WorkerParameters
import java.util.concurrent.TimeUnit

class ProtectionHealthWorker(appContext: Context, params: WorkerParameters) :
	Worker(appContext, params) {

	override fun doWork(): Result {
		return try {
			if (!PornBlockVpnService.isRunning()) {
				applicationContext.sendBroadcast(Intent("CRAVEOFF_PROTECTION_OFF"))
			}
			Result.success()
		} catch (_: Throwable) {
			Result.retry()
		}
	}

	companion object {
		private const val UNIQUE_NAME = "CraveOffProtectionHealth"
		fun schedule(context: Context) {
			try {
				val constraints = Constraints.Builder()
					.setRequiredNetworkType(NetworkType.CONNECTED)
					.build()
				val req = PeriodicWorkRequestBuilder<ProtectionHealthWorker>(30, TimeUnit.MINUTES)
					.setConstraints(constraints)
					.build()
				WorkManager.getInstance(context).enqueueUniquePeriodicWork(
					UNIQUE_NAME,
					ExistingPeriodicWorkPolicy.UPDATE,
					req
				)
			} catch (_: Throwable) { }
		}
		fun cancel(context: Context) {
			try {
				WorkManager.getInstance(context).cancelUniqueWork(UNIQUE_NAME)
			} catch (_: Throwable) { }
		}
	}
}


