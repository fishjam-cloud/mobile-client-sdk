package io.fishjam.reactnative.utils

import android.content.Intent
import android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA
import android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
import android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
import android.os.Build
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.records.Field
import io.fishjam.reactnative.FishjamForegroundService
import io.fishjam.reactnative.ForegroundServiceConfig

class ForegroundServiceNotificationOptions(
  val channelId: String,
  val channelName: String,
  val notificationContent: String,
  val notificationTitle: String
) {}

class ForegroundServiceManager(private val appContext: AppContext) {
  var config: ForegroundServiceConfig? = null

  fun startForegroundService(withScreenCast: Boolean = false)  {
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
//      throw CodedException(message = "`foregroundServiceTypes` cannot be empty")
      stopForegroundService()
      return;
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
    serviceIntent.putExtra("foregroundServiceTypes", foregroundServiceTypes.toIntArray())

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

    val serviceIntent: Intent = Intent(
      appContext.reactContext, FishjamForegroundService::class.java
    )

    appContext.reactContext!!.stopService(serviceIntent)
  }
}
