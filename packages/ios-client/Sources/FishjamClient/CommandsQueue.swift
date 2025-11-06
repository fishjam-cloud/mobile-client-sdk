import Promises

class CommandQueueError: Error {
    let message: String

    init(_ message: String) {
        self.message = message
    }
}

internal class CommandsQueue {
    var clientState: ClientState = ClientState.CREATED
    private var commandsQueue: [Command] = []
    private var canProcessCommands: () -> Bool

    init(canProcessCommands: @escaping () -> Bool) {
        self.canProcessCommands = canProcessCommands
    }

    @discardableResult
    func addCommand(_ command: Command) -> Promise<Void> {
        commandsQueue.append(command)

        if canProcessCommands() && commandsQueue.count == 1 {
            command.execute()
        }
        return command.promise
    }

    func finishCommand() {
        guard canProcessCommands() else {
            return
        }
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
            command.promise.reject(CommandQueueError("Command queue was cleared"))
        }
        commandsQueue.removeAll()
    }

}
