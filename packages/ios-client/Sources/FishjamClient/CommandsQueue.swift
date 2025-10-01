import Promises

class CommandQueueError: Error {
    let message: String

    init(_ message: String) {
        self.message = message
    }
}

public class CommandsQueue {
    public var clientState: ClientState = ClientState.CREATED
    private var commandsQueue: [Command] = []

    @discardableResult
    public func addCommand(_ command: Command) -> Promise<Void> {
        commandsQueue.append(command)
        if commandsQueue.count == 1 {
            command.execute()
        }
        return command.promise
    }

    public func finishCommand() {
        guard let command = commandsQueue.first else { return }
        commandsQueue.removeFirst()
        if let nextState = command.clientStateAfterCommand {
            clientState = nextState
        }
        if let nextCommand = commandsQueue.first {
            nextCommand.execute()
        }

    }

    public func finishCommand(commandName: CommandName) {
        if !commandsQueue.isEmpty && commandsQueue.first!.commandName == commandName {
            finishCommand()
        }
    }

    public func finishCommand(commandNames: [CommandName]) {
        if !commandsQueue.isEmpty && commandNames.contains(commandsQueue.first!.commandName) {
            finishCommand()
        }
    }

    public func clear() {
        clientState = .CREATED
        commandsQueue.forEach { command in
            command.promise.reject(CommandQueueError("Command queue was cleared"))
        }
        commandsQueue.removeAll()
    }

}
