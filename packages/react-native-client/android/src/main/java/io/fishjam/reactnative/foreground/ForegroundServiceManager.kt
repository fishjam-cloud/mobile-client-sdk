package io.fishjam.reactnative.foreground

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA
import android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
import android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
import android.os.Binder
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import io.fishjam.reactnative.FishjamForegroundService
import io.fishjam.reactnative.ForegroundServiceConfig
import io.fishjam.reactnative.RNFishjamClient.Companion.fishjamClient
import io.fishjam.reactnative.utils.PermissionUtils
import kotlinx.coroutines.launch

class ForegroundServiceManager(
  private val appContext: AppContext,
  private val onServiceConnected: () -> Unit
) {
  private lateinit var serviceInstance: FishjamForegroundService

  var isServiceBound: Boolean = false
    private set

  private val serviceIntent = Intent(
    appContext.reactContext, FishjamForegroundService::class.java
  )

  private val connection = object : ServiceConnection {
    override fun onServiceConnected(className: ComponentName, service: IBinder) {
      val binder = service as FishjamForegroundService.LocalBinder
      serviceInstance = binder.getService()
      isServiceBound = true
      onServiceConnected()
    }

    override fun onServiceDisconnected(arg0: ComponentName) {
      isServiceBound = false
    }
  }

  fun startForegroundService(config: ForegroundServiceConfig) {
    if (appContext.reactContext == null) {
      throw CodedException(message = "reactContext not found")
    }

    if (!isServiceBound) {
      appContext.currentActivity!!.bindService(serviceIntent, connection, Context.BIND_AUTO_CREATE)
    }

    val channelId =
      config.channelId
        ?: throw CodedException(message = "Missing `channelId` for startForegroundService")
    val channelName =
      config.channelName
        ?: throw CodedException(message = "Missing `channelName` for startForegroundService")
    val notificationContent =
      config.notificationContent
        ?: throw CodedException(message = "Missing `notificationContent` for startForegroundService")
    val notificationTitle =
      config.notificationTitle
        ?: throw CodedException(message = "Missing `notificationTitle` for startForegroundService")
    val foregroundServiceTypes = config.foregroundServiceTypes

    if (foregroundServiceTypes.isEmpty()) {
      throw CodedException(message = "`foregroundServiceTypes` cannot be empty")
    }

    serviceIntent.putExtra("channelId", channelId)
    serviceIntent.putExtra("channelName", channelName)
    serviceIntent.putExtra("notificationTitle", notificationContent)
    serviceIntent.putExtra("notificationContent", notificationTitle)
    serviceIntent.putExtra("foregroundServiceTypes", foregroundServiceTypes)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      appContext.reactContext!!.startForegroundService(serviceIntent)
    } else {
      appContext.reactContext!!.startService(serviceIntent)
    }
  }

  fun stopForegroundService() {
    if (appContext.reactContext == null) {
      throw CodedException(message = "reactContext not found")
    }

    appContext.reactContext!!.stopService(serviceIntent)
  }
}
