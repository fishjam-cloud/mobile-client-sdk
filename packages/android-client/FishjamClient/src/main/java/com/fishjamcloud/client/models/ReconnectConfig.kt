package com.fishjamcloud.client.models

data class ReconnectConfig(
  val maxAttempts: Int = 5,
  val initialDelayMs: Long = 1000,
  val delayMs: Long = 1000
)
