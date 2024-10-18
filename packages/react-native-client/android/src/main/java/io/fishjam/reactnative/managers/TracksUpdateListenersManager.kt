package io.fishjam.reactnative.managers

interface TrackUpdateListener {
  fun onTracksUpdate()
}

class TracksUpdateListenersManager : ListenerManager<TrackUpdateListener>() {
  fun notifyListeners() {
    for (listener in listeners) listener.onTracksUpdate()
  }
}
