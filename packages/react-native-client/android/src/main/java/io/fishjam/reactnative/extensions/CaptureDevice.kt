package io.fishjam.reactnative.extensions

import com.fishjamcloud.client.media.CaptureDevice

typealias LocalCamera = Map<String, Any>

fun CaptureDevice.toLocalCamera(): LocalCamera {
  return mapOf<String, Any>(
    "id" to deviceName,
    "name" to deviceName,
    "facingDirection" to
      when (true) {
        isFrontFacing -> "front"
        isBackFacing -> "back"
        else -> "unspecified"
      }
  )
}
