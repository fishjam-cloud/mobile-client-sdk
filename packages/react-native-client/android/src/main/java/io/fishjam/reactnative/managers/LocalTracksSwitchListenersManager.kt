package io.fishjam.reactnative.managers

interface LocalTrackSwitchListener {
  suspend fun onLocalTrackWillSwitch()

  suspend fun onLocalTrackSwitched()
}

class LocalTracksSwitchListenersManager {
  private val listeners: MutableList<LocalTrackSwitchListener> = mutableListOf()

  fun add(listener: LocalTrackSwitchListener) {
    listeners.add(listener)
  }

  fun remove(listener: LocalTrackSwitchListener) {
    listeners.remove(listener)
  }

  suspend fun notifyWillSwitch() {
    for (listener in listeners) listener.onLocalTrackWillSwitch()
  }

  suspend fun notifySwitched() {
    for (listener in listeners) listener.onLocalTrackSwitched()
  }
}
