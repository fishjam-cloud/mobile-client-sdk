package io.fishjam.reactnative.managers

interface TrackUpdateListener {
  fun onTracksUpdate()
}

class TracksUpdateListenersManager : SingleListenerManager<TrackUpdateListener>(TrackUpdateListener::onTracksUpdate)
