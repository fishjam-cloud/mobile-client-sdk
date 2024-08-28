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

enum class ReconnectionStatus {
  IDLE,
  RECONNECTING,
  ERROR,
  WAITING
}

internal class ReconnectionManager(
  private var reconnectConfig: ReconnectConfig = ReconnectConfig(),
  private val connect: () -> Unit
) {
  private val listeners = mutableListOf<ReconnectionManagerListener>()
  private var reconnectAttempts = 0
  private var reconnectionStatus = ReconnectionStatus.IDLE

  // attempts to reconnect if suitable
  fun onDisconnected() {
    if (reconnectAttempts >= reconnectConfig.maxAttempts) {
      reconnectionStatus = ReconnectionStatus.ERROR
      listeners.forEach { it.onReconnectionRetriesLimitReached() }
      return
    }

    if (reconnectionStatus == ReconnectionStatus.WAITING) {
      return
    }

    if (reconnectionStatus != ReconnectionStatus.RECONNECTING) {
      reconnectionStatus = ReconnectionStatus.RECONNECTING
      listeners.forEach { it.onReconnectionStarted() }
    }
    val delay = reconnectConfig.initialDelayMs + reconnectAttempts * reconnectConfig.delayMs
    reconnectAttempts += 1
    Timer().schedule(delay) {
      reconnectionStatus = ReconnectionStatus.RECONNECTING
      connect()
    }
  }

  fun onReconnected() {
    if (reconnectionStatus != ReconnectionStatus.RECONNECTING) return
    reset()
    listeners.forEach { it.onReconnected() }
  }

  fun reset() {
    reconnectAttempts = 0
    reconnectionStatus = ReconnectionStatus.IDLE
  }

  fun addListener(listener: ReconnectionManagerListener) {
    listeners.add(listener)
  }

  fun removeListener(listener: ReconnectionManagerListener) {
    listeners.remove(listener)
  }
}
