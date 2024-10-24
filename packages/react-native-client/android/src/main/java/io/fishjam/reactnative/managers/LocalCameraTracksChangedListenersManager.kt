package io.fishjam.reactnative.managers

interface LocalCameraTrackChangedListener {
  fun onLocalCameraTrackChanged()
}

class LocalCameraTracksChangedListenersManager :
  SingleListenerManager<LocalCameraTrackChangedListener>(LocalCameraTrackChangedListener::onLocalCameraTrackChanged)
