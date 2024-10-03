package io.fishjam.reactnative.foregroundService

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA
import android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
import android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
import android.os.Binder
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import io.fishjam.reactnative.foregroundService.FishjamForegroundService
import io.fishjam.reactnative.ForegroundServiceConfig
import io.fishjam.reactnative.utils.PermissionUtils

class ForegroundServiceNotificationOptions(
  val channelId: String,
  val channelName: String,
  val notificationContent: String,
  val notificationTitle: String
) {}

class ForegroundServiceManager(private val appContext: AppContext) {
  var config: ForegroundServiceConfig? = null

  fun startForegroundService(withScreenCast: Boolean = false): Intent  {
    if (appContext.reactContext == null) {
      throw CodedException(message = "reactContext not found")
    }

    val config = this.config ?: throw CodedException(message = "foreground service config not found")

    val channelId = config.channelId
      ?: throw CodedException(message = "Missing `channelId` for startForegroundService")
    val channelName = config.channelName
      ?: throw CodedException(message = "Missing `channelName` for startForegroundService")
    val notificationContent = config.notificationContent
      ?: throw CodedException(message = "Missing `notificationContent` for startForegroundService")
    val notificationTitle = config.notificationTitle
      ?: throw CodedException(message = "Missing `notificationTitle` for startForegroundService")

    val foregroundServiceTypes = mutableListOf<Int>()

    if (config.enableCamera) {
      foregroundServiceTypes.add(FOREGROUND_SERVICE_TYPE_CAMERA)
    }

    if (config.enableMicrophone) {
      foregroundServiceTypes.add(FOREGROUND_SERVICE_TYPE_MICROPHONE)
    }

    if (withScreenCast && config.enableScreencast) {
      foregroundServiceTypes.add(FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION)
    }

    if (foregroundServiceTypes.isEmpty()) {
      stopForegroundService()
      throw CodedException(message = "`foregroundServiceTypes` cannot be empty")
    }

    if (foregroundServiceTypes.contains(FOREGROUND_SERVICE_TYPE_CAMERA) && !PermissionUtils.hasCameraPermission(
        appContext
      )
    ) {
      throw CodedException("Cannot start a camera foreground service without camera permission.")
    }

    if (foregroundServiceTypes.contains(FOREGROUND_SERVICE_TYPE_MICROPHONE) && !PermissionUtils.hasMicrophonePermission(
        appContext
      )
    ) {
      throw CodedException("Cannot start a microphone foreground service without microphone permission.")
    }

    val serviceIntent = Intent(
      appContext.reactContext, FishjamForegroundService::class.java
    )

    serviceIntent.putExtra("channelId", channelId)
    serviceIntent.putExtra("channelName", channelName)
    serviceIntent.putExtra("notificationTitle", notificationContent)
    serviceIntent.putExtra("notificationContent", notificationTitle)
    serviceIntent.putExtra("foregroundServiceTypes", foregroundServiceTypes.toIntArray())

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      appContext.reactContext!!.startForegroundService(serviceIntent)
    } else {
      appContext.reactContext!!.startService(serviceIntent)
    }

    return serviceIntent
  }

  fun stopForegroundService() {
    if (appContext.reactContext == null) {
      throw CodedException(message = "reactContext not found")
    }

    val serviceIntent: Intent = Intent(
      appContext.reactContext, FishjamForegroundService::class.java
    )

    appContext.reactContext!!.stopService(serviceIntent)
  }
}

class FishjamForegroundService : Service() {
  companion object {
    private const val FOREGROUND_SERVICE_ID = 1668
  }

  // Method for clients to interact with the service
  inner class LocalBinder : Binder() {
    // Return this instance of LocalService so clients can call public methods.
    fun getService(): FishjamForegroundService = this@FishjamForegroundService
  }

  // Binder given to clients
  private val binder: IBinder = LocalBinder()

  override fun onBind(p0: Intent?): IBinder {
    return binder
  }

  override fun onStartCommand(
    intent: Intent?,
    flags: Int,
    startId: Int
  ): Int {
    val channelId = intent!!.getStringExtra("channelId")!!
    val channelName = intent.getStringExtra("channelName")!!
    val notificationTitle = intent.getStringExtra("notificationTitle")!!
    val notificationContent = intent.getStringExtra("notificationContent")!!
    val foregroundServiceTypesArray = intent.getIntArrayExtra("foregroundServiceTypes")!!
    // Create "bitwise or" of foregroundServiceTypesArray
    val foregroundServiceType = foregroundServiceTypesArray.reduce { acc, value -> acc or value }

    val pendingIntent =
      PendingIntent.getActivity(
        this,
        0,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
      )

    val notification: Notification =
      NotificationCompat.Builder(this, channelId)
        .setContentTitle(notificationTitle)
        .setContentText(notificationContent)
        .setContentIntent(pendingIntent)
        .build()

    createNotificationChannel(channelId, channelName)
    startForegroundWithNotification(notification, foregroundServiceType)

    return START_NOT_STICKY
  }

  private fun startForegroundWithNotification(
    notification: Notification,
    foregroundServiceType: Int
  ) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(
        FOREGROUND_SERVICE_ID,
        notification,
        foregroundServiceType
      )
    } else {
      startForeground(
        FOREGROUND_SERVICE_ID,
        notification
      )
    }
  }

  private fun createNotificationChannel(
    channelId: String,
    channelName: String
  ) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }

    val serviceChannel =
      NotificationChannel(
        channelId,
        channelName,
        NotificationManager.IMPORTANCE_LOW
      )
    val notificationManager = getSystemService(NOTIFICATION_SERVICE) as? NotificationManager
    notificationManager?.createNotificationChannel(serviceChannel)
  }
}
