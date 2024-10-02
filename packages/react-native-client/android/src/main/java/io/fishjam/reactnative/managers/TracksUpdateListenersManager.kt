package io.fishjam.reactnative.managers

interface TrackUpdateListener {
  fun onTracksUpdate()
}

class TracksUpdateListenersManager {
  private val listeners: MutableList<TrackUpdateListener> = mutableListOf()

  fun add(listener: TrackUpdateListener) {
    listeners.add(listener)
  }

  fun remove(listener: TrackUpdateListener) {
    listeners.remove(listener)
  }

  fun notify() {
    for (listener in listeners) listener.onTracksUpdate()
  }
}
