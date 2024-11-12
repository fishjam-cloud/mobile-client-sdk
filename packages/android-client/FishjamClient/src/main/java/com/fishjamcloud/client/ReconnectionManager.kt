package com.fishjamcloud.client

import com.fishjamcloud.client.models.ReconnectConfig
import timber.log.Timber
import java.util.Timer
import kotlin.concurrent.schedule

interface ReconnectionManagerListener {
  fun onReconnectionStarted() {
    Timber.i("Reconnection started")
  }

  fun onReconnected() {
    Timber.i("Reconnected successfully")
  }

  fun onReconnectionRetriesLimitReached() {
    Timber.e("Reconnection retries limit reached")
  }
}

@Suppress("ktlint:standard:enum-entry-name-case")
enum class ReconnectionStatus {
  idle,
  reconnecting,
  error
}

internal class ReconnectionManager(
  private var reconnectConfig: ReconnectConfig = ReconnectConfig(),
  private val connect: () -> Unit
) {
  private val listeners = mutableListOf<ReconnectionManagerListener>()
  private var reconnectAttempts = 0
  private var reconnectionStatus = ReconnectionStatus.idle

  // attempts to reconnect if suitable
  fun onDisconnected() {
    if (reconnectAttempts >= reconnectConfig.maxAttempts) {
      reconnectionStatus = ReconnectionStatus.error
      listeners.forEach { it.onReconnectionRetriesLimitReached() }
      return
    }

    if (reconnectionStatus == ReconnectionStatus.reconnecting) return
    reconnectionStatus = ReconnectionStatus.reconnecting

    listeners.forEach { it.onReconnectionStarted() }
    val delay = reconnectConfig.initialDelayMs + reconnectAttempts * reconnectConfig.delayMs
    reconnectAttempts += 1

    Timer().schedule(delay) {
      connect()
    }
  }

  fun onReconnected() {
    if (reconnectionStatus != ReconnectionStatus.reconnecting) return
    reset()
    listeners.forEach { it.onReconnected() }
  }

  fun reset() {
    reconnectAttempts = 0
    reconnectionStatus = ReconnectionStatus.idle
  }

  fun addListener(listener: ReconnectionManagerListener) {
    listeners.add(listener)
  }

  fun removeListener(listener: ReconnectionManagerListener) {
    listeners.remove(listener)
  }
}
