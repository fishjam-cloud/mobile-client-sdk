package io.fishjam.reactnative.foregroundService

import android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA
import android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
import android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import io.fishjam.reactnative.utils.PermissionUtils

data class ForegroundServiceState(
  var cameraEnabled: Boolean = false,
  var microphoneEnabled: Boolean = false,
  var screenSharingEnabled: Boolean = false,
  var channelId: String = "com.fishjam.foregroundservice.channel",
  var channelName: String = "Fishjam Notifications",
  var notificationContent: String = "[PLACEHOLDER] Your video call is ongoing",
  var notificationTitle: String = "[PLACEHOLDER] Tap to return to the call."
) {
  fun buildForegroundServiceTypes(appContext: AppContext): List<Int> =
    buildList {
      if (cameraEnabled) {
        addIfPermissionGranted(
          FOREGROUND_SERVICE_TYPE_CAMERA,
          "camera"
        ) { PermissionUtils.hasCameraPermission(appContext) }
      }
      if (microphoneEnabled) {
        addIfPermissionGranted(
          FOREGROUND_SERVICE_TYPE_MICROPHONE,
          "microphone"
        ) { PermissionUtils.hasMicrophonePermission(appContext) }
      }
      if (screenSharingEnabled) add(FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION)
    }

  private fun MutableList<Int>.addIfPermissionGranted(
    serviceType: Int,
    permissionName: String,
    hasPermission: () -> Boolean
  ) {
    if (!hasPermission()) {
      throw CodedException("Cannot start a $permissionName foreground service without $permissionName permission.")
    }
    add(serviceType)
  }
}
