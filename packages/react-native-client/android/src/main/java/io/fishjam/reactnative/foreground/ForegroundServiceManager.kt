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
  notificationConfig: ForegroundServiceNotificationConfig
) {
  private var isServiceBound: Boolean = false

  private val serviceIntent =
    Intent(
      appContext.reactContext,
      FishjamForegroundService::class.java
    ).apply {
      putExtra("channelId", notificationConfig.channelId ?: throw CodedException("Missing `channelId` for startForegroundService"))
      putExtra("channelName", notificationConfig.channelName ?: throw CodedException("Missing `channelName` for startForegroundService"))
      putExtra(
        "notificationContent",
        notificationConfig.notificationContent ?: throw CodedException("Missing `notificationContent` for startForegroundService")
      )
      putExtra(
        "notificationTitle",
        notificationConfig.notificationTitle ?: throw CodedException("Missing `notificationTitle` for startForegroundService")
      )
    }

  private var onServiceConnected: (() -> Unit)? = null

  private val connection =
    object : ServiceConnection {
      override fun onServiceConnected(
        className: ComponentName,
        service: IBinder
      ) {
        isServiceBound = true
        onServiceConnected?.invoke()
      }

      override fun onServiceDisconnected(arg0: ComponentName) {
        isServiceBound = false
      }
    }

  fun startForegroundService(
    permissionsConfig: ForegroundServicePermissionsConfig,
    onServiceConnected: (() -> Unit)
  ) {
    val reactContext =
      appContext.reactContext
        ?: throw CodedException("reactContext not found")

    val foregroundServiceTypes = buildForegroundServiceTypes(permissionsConfig)

    // If no service type was passed, save the latest config for later calls to startForegroundService
    // for example to use with screen sharing.
    if (foregroundServiceTypes.isEmpty()) {
      return
    }

    serviceIntent.putExtra("foregroundServiceTypes", foregroundServiceTypes.toIntArray())

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      reactContext.startForegroundService(serviceIntent)
    } else {
      reactContext.startService(serviceIntent)
    }

    bindServiceIfNeeded(onServiceConnected)
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

  private fun buildForegroundServiceTypes(permissionsConfig: ForegroundServicePermissionsConfig): List<Int> =
    buildList {
      if (permissionsConfig.enableCamera) {
        checkPermissionAndAdd(FOREGROUND_SERVICE_TYPE_CAMERA, "camera", PermissionUtils::hasCameraPermission)
      }
      if (permissionsConfig.enableMicrophone) {
        checkPermissionAndAdd(FOREGROUND_SERVICE_TYPE_MICROPHONE, "microphone", PermissionUtils::hasMicrophonePermission)
      }
      if (permissionsConfig.enableScreenSharing) {
        add(FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION)
      }
    }

  private fun MutableList<Int>.checkPermissionAndAdd(
    serviceType: Int,
    permissionName: String,
    hasPermission: (AppContext) -> Boolean
  ) {
    if (!hasPermission(appContext)) {
      throw CodedException("Cannot start a $permissionName foreground service without $permissionName permission.")
    }
    add(serviceType)
  }

  private fun bindServiceIfNeeded(onServiceConnected: () -> Unit) {
    if (!isServiceBound) {
      this.onServiceConnected = onServiceConnected
      appContext.currentActivity?.bindService(serviceIntent, connection, Context.BIND_AUTO_CREATE)
        ?: throw CodedException("Current activity not found")
    } else {
      onServiceConnected()
    }
  }
}
