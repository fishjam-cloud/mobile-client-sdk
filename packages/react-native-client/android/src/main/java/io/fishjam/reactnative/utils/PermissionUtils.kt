package io.fishjam.reactnative.utils

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import expo.modules.kotlin.AppContext
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

object PermissionUtils {


    suspend fun isCameraAuthorized(appContext: AppContext?): Boolean {
        return when {
            ContextCompat.checkSelfPermission(appContext?.reactContext!!, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED -> {
                true
            }
            else -> {
                suspendCancellableCoroutine { continuation ->
                    val activity = context as? FragmentActivity
                    activity?.let {
                        val requestPermissionLauncher = activity.registerForActivityResult(
                            ActivityResultContracts.RequestPermission()
                        ) { isGranted: Boolean ->
                            continuation.resume(isGranted)
                        }

                        requestPermissionLauncher.launch(Manifest.permission.CAMERA)

                        continuation.invokeOnCancellation {
                            requestPermissionLauncher.unregister()
                        }
                    } ?: continuation.resume(false)
                }
            }
        }
    }

  suspend fun isMicrophoneAuthorized(context: Context): Boolean {
    return when {
      ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED -> {
        true
      }
      else -> {
        suspendCancellableCoroutine { continuation ->
          val activity = context as? FragmentActivity
          activity?.let {
            val requestPermissionLauncher = activity.registerForActivityResult(
              ActivityResultContracts.RequestPermission()
            ) { isGranted: Boolean ->
              continuation.resume(isGranted)
            }

            requestPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)

            continuation.invokeOnCancellation {
              requestPermissionLauncher.unregister()
            }
          } ?: continuation.resume(false)
        }
      }
    }
  }
}
