package io.fishjam.reactnative.utils

import android.Manifest
import android.content.pm.PackageManager
import expo.modules.interfaces.permissions.Permissions
import expo.modules.interfaces.permissions.PermissionsStatus
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

object PermissionUtils {
  suspend fun isCameraAuthorized(appContext: AppContext?): Boolean = requestAccessIfNeeded(appContext, Manifest.permission.CAMERA)
  suspend fun isMicrophoneAuthorized(appContext: AppContext?): Boolean = requestAccessIfNeeded(appContext, Manifest.permission.RECORD_AUDIO)

  private suspend fun requestAccessIfNeeded(
    appContext: AppContext?,
    permission: String
  ): Boolean {
    val permissionsManager: Permissions =
      appContext?.permissions
        ?: throw Exceptions.PermissionsModuleNotFound()

    val isGranted = appContext.reactContext?.checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED

    if (isGranted) {
      return true
    }

    return suspendCoroutine { continuation ->
      permissionsManager.askForPermissions({ result ->
        continuation.resume(result[permission]?.status == PermissionsStatus.GRANTED)
      }, permission)
    }
  }
}
