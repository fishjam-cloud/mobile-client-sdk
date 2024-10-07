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
import io.fishjam.reactnative.ForegroundServiceNotificationConfig
import io.fishjam.reactnative.ForegroundServicePermissionsConfig
import io.fishjam.reactnative.utils.PermissionUtils
import kotlinx.coroutines.CancellableContinuation
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

class ForegroundServiceManager(
  private val appContext: AppContext,
  notificationConfig: ForegroundServiceNotificationConfig
) {
  private val reactContext by lazy {
    appContext.reactContext ?: throw CodedException("reactContext not found")
  }
  private var isServiceBound: Boolean = false
  private var serviceConnectedContinuation: CancellableContinuation<Unit>? = null

  private val serviceIntent =
    Intent(
      appContext.reactContext,
      FishjamForegroundService::class.java
    ).apply {
      putExtra(
        "channelId",
        notificationConfig.channelId.orThrow("channelId")
      )
      putExtra(
        "channelName",
        notificationConfig.channelName.orThrow("channelName")
      )
      putExtra(
        "notificationContent",
        notificationConfig.notificationContent.orThrow("notificationContent")
      )
      putExtra(
        "notificationTitle",
        notificationConfig.notificationTitle.orThrow("notificationTitle")
      )
    }

  private val connection =
    object : ServiceConnection {
      override fun onServiceConnected(
        className: ComponentName,
        service: IBinder
      ) {
        isServiceBound = true
        serviceConnectedContinuation?.resume(Unit)
        serviceConnectedContinuation = null
      }

      override fun onServiceDisconnected(arg0: ComponentName) {
        isServiceBound = false
        serviceConnectedContinuation?.cancel()
        serviceConnectedContinuation = null
      }
    }

  suspend fun startForegroundService(permissionsConfig: ForegroundServicePermissionsConfig) {
    val foregroundServiceTypes = buildForegroundServiceTypes(permissionsConfig)

    if (foregroundServiceTypes.isEmpty()) {
      return
    }

    serviceIntent.putExtra("foregroundServiceTypes", foregroundServiceTypes.toIntArray())

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      reactContext.startForegroundService(serviceIntent)
    } else {
      reactContext.startService(serviceIntent)
    }

    bindServiceIfNeededAndAwait()
  }

  fun stopForegroundService() {
    if (isServiceBound) {
      appContext.currentActivity?.unbindService(connection)
        ?: throw CodedException("Current activity not found")
      isServiceBound = false
    }
    reactContext.stopService(serviceIntent)
    serviceConnectedContinuation?.cancel()
    serviceConnectedContinuation = null
  }

  private fun buildForegroundServiceTypes(permissionsConfig: ForegroundServicePermissionsConfig): List<Int> =
    buildList {
      if (permissionsConfig.enableCamera) {
        addIfPermissionGranted(
          FOREGROUND_SERVICE_TYPE_CAMERA,
          "camera",
          PermissionUtils::hasCameraPermission
        )
      }
      if (permissionsConfig.enableMicrophone) {
        addIfPermissionGranted(
          FOREGROUND_SERVICE_TYPE_MICROPHONE,
          "microphone",
          PermissionUtils::hasMicrophonePermission
        )
      }
      if (permissionsConfig.enableScreenSharing) add(FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION)
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
          appContext.currentActivity?.bindService(serviceIntent, connection, Context.BIND_AUTO_CREATE)
        }.onFailure { error ->
          continuation.cancel(CodedException("Failed to bind service: ${error.message}"))
        }
      } else {
        continuation.resume(Unit)
        serviceConnectedContinuation = null
      }
    }
}

private fun String?.orThrow(fieldName: String): String = this ?: throw CodedException("Missing `$fieldName` for startForegroundService")
