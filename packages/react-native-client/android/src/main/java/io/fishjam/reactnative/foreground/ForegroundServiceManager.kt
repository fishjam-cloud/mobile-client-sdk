package io.fishjam.reactnative.foreground

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA
import android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
import android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
import android.os.Build
import android.os.IBinder
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import io.fishjam.reactnative.FishjamForegroundService
import io.fishjam.reactnative.ForegroundServiceNotificationConfig
import io.fishjam.reactnative.ForegroundServicePermissionsConfig
import io.fishjam.reactnative.utils.PermissionUtils

class ForegroundServiceManager(
  private val appContext: AppContext,
  private val notificationConfig: ForegroundServiceNotificationConfig,
) {

  private var isServiceBound: Boolean = false

  private val serviceIntent = Intent(
    appContext.reactContext, FishjamForegroundService::class.java
  )

  private var onServiceConnected: (() -> Unit)? = null

  private val connection = object : ServiceConnection {
    override fun onServiceConnected(className: ComponentName, service: IBinder) {
      isServiceBound = true
      onServiceConnected?.invoke()
    }

    override fun onServiceDisconnected(arg0: ComponentName) {
      isServiceBound = false
    }
  }

  fun startForegroundService(permissionsConfig: ForegroundServicePermissionsConfig, onServiceConnected: (() -> Unit)) {
    if (appContext.reactContext == null) {
      throw CodedException(message = "reactContext not found")
    }

    val channelId =
      notificationConfig.channelId
        ?: throw CodedException(message = "Missing `channelId` for startForegroundService")
    val channelName =
      notificationConfig.channelName
        ?: throw CodedException(message = "Missing `channelName` for startForegroundService")
    val notificationContent =
      notificationConfig.notificationContent
        ?: throw CodedException(message = "Missing `notificationContent` for startForegroundService")
    val notificationTitle =
      notificationConfig.notificationTitle
        ?: throw CodedException(message = "Missing `notificationTitle` for startForegroundService")

    val foregroundServiceTypes = mutableListOf<Int>()

    if (permissionsConfig.enableCamera) {
      if (!PermissionUtils.hasCameraPermission(appContext)) {
        throw CodedException("Cannot start a camera foreground service without camera permission.")
      }
      foregroundServiceTypes.add(FOREGROUND_SERVICE_TYPE_CAMERA)
    }

    if (permissionsConfig.enableMicrophone) {
      if (!PermissionUtils.hasMicrophonePermission(appContext)) {
        throw CodedException("Cannot start a microphone foreground service without microphone permission.")
      }
      foregroundServiceTypes.add(FOREGROUND_SERVICE_TYPE_MICROPHONE)
    }

    if (permissionsConfig.enableScreenSharing) {
      foregroundServiceTypes.add(FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION)
    }

    // If no service type was passed, save the latest config for later calls to startForegroundService
    // for example to use with screen sharing.
    if (foregroundServiceTypes.isEmpty()) {
      return
    }

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

    if (!isServiceBound) {
      this.onServiceConnected = onServiceConnected
      appContext.currentActivity!!.bindService(serviceIntent, connection, Context.BIND_AUTO_CREATE)
    } else {
      onServiceConnected()
    }
  }

  fun stopForegroundService() {
    if (appContext.reactContext == null) {
      throw CodedException(message = "reactContext not found")
    }

    if (isServiceBound) {
      appContext.currentActivity!!.unbindService(connection)
      isServiceBound = false
    }
    appContext.reactContext!!.stopService(serviceIntent)
  }
}
