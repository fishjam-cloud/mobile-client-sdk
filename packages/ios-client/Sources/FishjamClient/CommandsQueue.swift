import Promises

internal class CommandsQueue {
    var clientState: ClientState = ClientState.CREATED
    private var commandsQueue: [Command] = []

    @discardableResult
    func addCommand(_ command: Command) -> Promise<Void> {
        commandsQueue.append(command)
        if commandsQueue.count == 1 {
            command.execute()
        }
        return command.promise
    }

    func finishCommand() {
        guard let command = commandsQueue.first else { return }
        commandsQueue.removeFirst()
        if let nextState = command.clientStateAfterCommand {
            clientState = nextState
        }
        if let nextCommand = commandsQueue.first {
            nextCommand.execute()
        }

    }

    func finishCommand(commandName: CommandName) {
        if !commandsQueue.isEmpty && commandsQueue.first!.commandName == commandName {
            finishCommand()
        }
    }

    func finishCommand(commandNames: [CommandName]) {
        if !commandsQueue.isEmpty && commandNames.contains(commandsQueue.first!.commandName) {
            finishCommand()
        }
    }

    func clear() {
        clientState = .CREATED
        commandsQueue.forEach { command in
            command.promise.reject("Command queue was cleared")
        }
        commandsQueue.removeAll()
    }

}
