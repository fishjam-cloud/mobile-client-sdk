package io.fishjam.reactnative.managers

import java.util.concurrent.CopyOnWriteArrayList

abstract class ListenerManager<T> {
  protected var listeners = CopyOnWriteArrayList<T>()
    private set

  fun add(listener: T) {
    listeners.add(listener)
  }

  fun remove(listener: T) {
    listeners.remove(listener)
  }
}

open class SingleListenerManager<T>(
  private val notify: (T) -> Unit
) : ListenerManager<T>() {
  fun notifyListeners() {
    for (listener in listeners) notify(listener)
  }
}
