package com.fishjamcloud.client

import kotlinx.coroutines.CompletableJob
import kotlinx.coroutines.Job

internal enum class CommandName {
  CONNECT,
  JOIN,
  ADD_TRACK,
  REMOVE_TRACK,
  RENEGOTIATE,
  LEAVE
}

internal enum class ClientState {
  CREATED,
  CONNECTED,
  JOINED
}

internal data class Command(
  val commandName: CommandName,
  val clientStateAfterCommand: ClientState?,
  val execute: () -> Unit = {}
) {
  constructor(commandName: CommandName, command: () -> Unit = {}) : this(commandName, null, command)

  val job: CompletableJob = Job()
}
