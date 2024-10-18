package io.fishjam.reactnative.managers

interface LocalCameraTrackChangedListener {
  fun onLocalCameraTrackChanged()
}

class LocalCameraTracksChangedListenersManager : ListenerManager<LocalCameraTrackChangedListener>() {
  fun notifyListeners() {
    for (listener in listeners) listener.onLocalCameraTrackChanged()
  }
}
