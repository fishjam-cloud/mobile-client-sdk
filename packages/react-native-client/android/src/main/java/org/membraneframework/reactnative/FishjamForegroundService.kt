package org.membraneframework.reactnative

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

class FishjamForegroundService : Service() {
  companion object {
    private const val CHANNEL_ID: String =
      "org.membraneframework.reactnative.ForegroundServiceChannel" // TODO: Move to plugin
    private const val FOREGROUND_SERVICE_ID = 1
  }

  override fun onBind(p0: Intent?): IBinder? = null

  override fun onStartCommand(
    intent: Intent?,
    flags: Int,
    startId: Int
  ): Int {
    createNotificationChannel()

    val pendingIntent =
      PendingIntent.getActivity(
        this,
        0,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
      )

    val notification: Notification =
      NotificationCompat
        .Builder(this, CHANNEL_ID)
        .setContentTitle("Fishjam Client") // TODO: Use plugin for that
        .setContentText("Service is running in the foreground")
        .setContentIntent(pendingIntent)
        .build()

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      startForeground(
        FOREGROUND_SERVICE_ID,
        notification,
        ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION or ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA or
          ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
      )
    } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(
        FOREGROUND_SERVICE_ID,
        notification,
        ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
      )
    } else {
      startForeground(
        FOREGROUND_SERVICE_ID,
        notification
      )
    }

    return START_NOT_STICKY
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }

    val serviceChannel =
      NotificationChannel(
        CHANNEL_ID,
        "Fishjam Foreground Service Channel",
        NotificationManager.IMPORTANCE_DEFAULT
      )
    val notificationManager = getSystemService(NOTIFICATION_SERVICE) as? NotificationManager
    notificationManager?.createNotificationChannel(serviceChannel)
  }
}
