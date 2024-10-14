package io.fishjam.reactnative.foregroundService

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
import io.fishjam.reactnative.ForegroundServiceConfig
import io.fishjam.reactnative.utils.PermissionUtils
import kotlinx.coroutines.CancellableContinuation
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume


class ForegroundServiceManager(
  private val appContext: AppContext
) {
  private val reactContext by lazy {
    appContext.reactContext ?: throw CodedException("reactContext not found")
  }
  private var serviceInstance: FishjamForegroundService? = null
  private var isServiceBound: Boolean = false
  private var serviceConnectedContinuation: CancellableContinuation<Unit>? = null

  private val serviceIntent =
    Intent(
      appContext.reactContext,
      FishjamForegroundService::class.java
    )

  private var cameraEnabled = false
  private var microphoneEnabled = false
  private var screenSharingEnabled = false

  private var channelId = "com.fishjam.foregroundservice.channel"
  private var channelName = "Fishjam Notifications"
  private var notificationContent = "[PLACEHOLDER] Your video call is ongoing"
  private var notificationTitle = "[PLACEHOLDER] Tap to return to the call."

  private val connection =
    object : ServiceConnection {
      override fun onServiceConnected(
        className: ComponentName,
        service: IBinder
      ) {
        isServiceBound = true
        serviceInstance = (service as FishjamForegroundService.LocalBinder).getService()
        serviceConnectedContinuation?.resume(Unit)
        serviceConnectedContinuation = null
      }

      override fun onServiceDisconnected(arg0: ComponentName) {
        isServiceBound = false
        serviceInstance = null
        serviceConnectedContinuation?.cancel()
        serviceConnectedContinuation = null
      }
    }

  suspend fun startForegroundService(
    config: ForegroundServiceConfig?
  ) {
    config?.enableCamera?.let { cameraEnabled = it }
    config?.enableMicrophone?.let { microphoneEnabled = it }
    config?.channelId?.let { channelId = it }
    config?.channelName?.let { channelName = it }
    config?.notificationContent?.let { notificationContent = it }
    config?.notificationTitle?.let { notificationTitle = it }

    val foregroundServiceTypes = buildForegroundServiceTypes() // TODO: combine this all into some kind of state

    if (foregroundServiceTypes.isEmpty()) {
      stopForegroundService()
      return
    }

    serviceIntent.apply {
      putExtra("channelId", channelId)
      putExtra("channelName", channelName)
      putExtra("notificationContent", notificationContent)
      putExtra("notificationTitle", notificationTitle)
      putExtra("foregroundServiceTypes", foregroundServiceTypes.toIntArray())
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      reactContext.startForegroundService(serviceIntent)
    } else {
      reactContext.startService(serviceIntent)
    }

    bindServiceIfNeededAndAwait()
  }

  suspend fun startForegroundServiceForScreenSharingEnabled(enabled: Boolean) {
    screenSharingEnabled = enabled
    startForegroundService(null)
  }

  fun stopForegroundService() {
    if (isServiceBound) {
      appContext.currentActivity?.unbindService(connection)
        ?: throw CodedException("Current activity not found")
      isServiceBound = false
      serviceInstance = null
    }
    reactContext.stopService(serviceIntent)
    serviceConnectedContinuation?.cancel()
    serviceConnectedContinuation = null
  }

  private fun buildForegroundServiceTypes(): List<Int> =
    buildList {
      if (cameraEnabled) {
        addIfPermissionGranted(
          FOREGROUND_SERVICE_TYPE_CAMERA,
          "camera",
          PermissionUtils::hasCameraPermission
        )
      }
      if (microphoneEnabled) {
        addIfPermissionGranted(
          FOREGROUND_SERVICE_TYPE_MICROPHONE,
          "microphone",
          PermissionUtils::hasMicrophonePermission
        )
      }
      if (screenSharingEnabled) add(FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION)
    }

  private fun MutableList<Int>.addIfPermissionGranted(
    serviceType: Int,
    permissionName: String,
    hasPermission: (AppContext) -> Boolean
  ) {
    if (!hasPermission(appContext)) {
      throw CodedException("Cannot start a $permissionName foreground service without $permissionName permission.")
    }
    add(serviceType)
  }

  private suspend fun bindServiceIfNeededAndAwait() =
    suspendCancellableCoroutine { continuation ->
      if (!isServiceBound) {
        serviceConnectedContinuation = continuation
        runCatching {
          appContext.currentActivity?.bindService(
            serviceIntent,
            connection,
            Context.BIND_AUTO_CREATE
          )
        }.onFailure { error ->
          continuation.cancel(CodedException("Failed to bind service: ${error.message}"))
        }
      } else {
        serviceInstance?.restartService(serviceIntent)
        continuation.resume(Unit)
        serviceConnectedContinuation = null
      }
    }
}

private fun String?.orThrow(fieldName: String): String =
  this ?: throw CodedException("Missing `$fieldName` for startForegroundService")
