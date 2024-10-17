package io.fishjam.reactnative.managers

interface LocalTrackSwitchListener {
  suspend fun onLocalTrackWillSwitch()
  suspend fun onLocalTrackSwitched()
}

class LocalTracksSwitchListenersManager: ListenerManager<LocalTrackSwitchListener>() {
  suspend fun notifyWillSwitch() {
    for (listener in listeners) listener.onLocalTrackWillSwitch()
  }

  suspend fun notifySwitched() {
    for (listener in listeners) listener.onLocalTrackSwitched()
  }
}
