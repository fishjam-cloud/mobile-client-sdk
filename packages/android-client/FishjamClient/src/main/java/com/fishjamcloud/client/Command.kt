package com.fishjamcloud.client

import kotlin.coroutines.Continuation

internal enum class CommandName {
  CONNECT,
  JOIN,
  ADD_TRACK,
  REMOVE_TRACK
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

  var continuation: Continuation<Unit>? = null

  fun isConnectionCommand(): Boolean = commandName == CommandName.CONNECT || commandName == CommandName.JOIN
}
