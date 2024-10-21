package io.fishjam.reactnative.managers

abstract class ListenerManager<T> {
  protected var listeners: MutableList<T> = mutableListOf()
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
