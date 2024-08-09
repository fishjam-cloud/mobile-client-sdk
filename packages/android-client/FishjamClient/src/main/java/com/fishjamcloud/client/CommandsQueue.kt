package com.fishjamcloud.client

import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

internal class CommandsQueue {
  private var commandsQueue: ArrayDeque<Command> = ArrayDeque()
  var clientState: ClientState = ClientState.CREATED

  suspend fun addCommand(command: Command) {
    commandsQueue.add(command)
    suspendCoroutine { cont ->
      run {
        command.continuation = cont
        if (commandsQueue.size == 1) {
          command.execute()
        }
      }
    }
  }

  fun finishCommand() {
    val command = commandsQueue.first()
    commandsQueue.removeFirst()
    if (command.clientStateAfterCommand != null) {
      clientState = command.clientStateAfterCommand
    }
    command.continuation?.resume(Unit)
    // TODO: make it iterative, not recursive?
    if (commandsQueue.isNotEmpty()) {
      commandsQueue.first().execute()
    }
  }

  fun finishCommand(commandName: CommandName) {
    if (commandsQueue.isNotEmpty() && commandsQueue.first().commandName == commandName) {
      finishCommand()
    }
  }

  fun finishCommand(commandNames: List<CommandName>) {
    if (commandsQueue.isNotEmpty() && commandNames.contains(commandsQueue.first().commandName)) {
      finishCommand()
    }
  }

  fun onDisconnected() {
    clientState = ClientState.CREATED
    commandsQueue
      .filter { it.isConnectionCommand() }
      .forEach { command -> command.continuation?.resume(Unit) }
    commandsQueue.removeAll { it.isConnectionCommand() }
    if (commandsQueue.isNotEmpty()) {
      commandsQueue.first().execute()
    }
  }

  fun clear() {
    clientState = ClientState.CREATED
    commandsQueue.forEach { command -> command.continuation?.resume(Unit) }
    commandsQueue.clear()
  }
}
