import Promises

internal class CommandsQueue {
    var clientState: ClientState = ClientState.CREATED
    private var commandsQueue: [Command] = []

    @discardableResult
    func addCommand(_ command: Command) -> DispatchWorkItem {
        commandsQueue.append(command)
        if commandsQueue.count == 1 {
            command.execute()
        }
        return command.workItem
    }

    func finishCommand() {
        guard !(commandsQueue.isEmpty) else { return }
        let command = commandsQueue.first
        command?.workItem.wait()
        commandsQueue.removeFirst()
        if let nextState = command?.clientStateAfterCommand {
            clientState = nextState
        }
        if let nextCommand = commandsQueue.first {
            nextCommand.execute()
        }

    }

    func finishCommand(commandName: CommandName) {
        if let command = commandsQueue.first, command.commandName == commandName {
            finishCommand()
        }
    }

    func finishCommand(commandNames: [CommandName]) {
        if let command = commandsQueue.first, commandNames.contains(command.commandName) {
            finishCommand()
        }
    }

    func clear() {
        clientState = .CREATED
        commandsQueue.forEach { command in
            command.workItem.cancel()
        }
    }

}
