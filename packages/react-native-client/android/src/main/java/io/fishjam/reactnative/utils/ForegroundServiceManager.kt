package io.fishjam.reactnative.utils

import android.Manifest.permission.FOREGROUND_SERVICE_CAMERA
import android.content.Intent
import android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA
import android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
import android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
import android.os.Build
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import io.fishjam.reactnative.FishjamForegroundService
import io.fishjam.reactnative.ForegroundServiceConfig

class ForegroundServiceManager(private val appContext: AppContext) {
  var mediaProjectionForegroundServiceStarted = false
    private set

  fun startForegroundService(config: ForegroundServiceConfig)  {
    if (appContext.reactContext == null) {
      throw CodedException(message = "reactContext not found")
    }

    val channelId = config.channelId
      ?: throw CodedException(message = "Missing `channelId` for startForegroundService")
    val channelName = config.channelName
      ?: throw CodedException(message = "Missing `channelName` for startForegroundService")
    val notificationContent = config.notificationContent
      ?: throw CodedException(message = "Missing `notificationContent` for startForegroundService")
    val notificationTitle = config.notificationTitle
      ?: throw CodedException(message = "Missing `notificationTitle` for startForegroundService")
    val foregroundServiceTypes = config.foregroundServiceTypes

    if (foregroundServiceTypes.isEmpty()) {
      throw CodedException(message = "`foregroundServiceTypes` cannot be empty")
    }

    if (foregroundServiceTypes.contains(FOREGROUND_SERVICE_TYPE_CAMERA) && !PermissionUtils.hasCameraPermission(appContext)) {
      throw CodedException("Cannot start a camera foreground service without camera permission.")
    }

    if (foregroundServiceTypes.contains(FOREGROUND_SERVICE_TYPE_MICROPHONE) && !PermissionUtils.hasMicrophonePermission(appContext)) {
      throw CodedException("Cannot start a microphone foreground service without microphone permission.")
    }

    val serviceIntent = Intent(
      appContext.reactContext, FishjamForegroundService::class.java
    )

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

    if (foregroundServiceTypes.contains(FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION)) {
      mediaProjectionForegroundServiceStarted = true
    }

  }

  fun stopForegroundService() {
    if (appContext.reactContext == null) {
      throw CodedException(message = "reactContext not found")
    }

    val serviceIntent: Intent = Intent(
      appContext.reactContext, FishjamForegroundService::class.java
    )

    appContext.reactContext!!.stopService(serviceIntent)
    mediaProjectionForegroundServiceStarted = false
  }
}
