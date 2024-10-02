package io.fishjam.reactnative.managers

interface LocalCameraTrackChangedListener {
  fun onLocalCameraTrackChanged()
}

class LocalCameraTracksChangedListenersManager {
  private var listeners: MutableList<LocalCameraTrackChangedListener> = mutableListOf()

  fun add(listener: LocalCameraTrackChangedListener) {
    listeners.add(listener)
  }

  fun remove(listener: LocalCameraTrackChangedListener) {
    listeners.remove(listener)
  }

  fun notify() {
    for (listener in listeners) listener.onLocalCameraTrackChanged()
  }
}
