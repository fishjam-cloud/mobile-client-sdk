package io.fishjam.reactnative.managers

interface CameraDeviceChangedListener {
  fun onCameraDeviceChanged()
}

class CameraDeviceChangedListenerManager :
  SingleListenerManager<CameraDeviceChangedListener>(CameraDeviceChangedListener::onCameraDeviceChanged)
