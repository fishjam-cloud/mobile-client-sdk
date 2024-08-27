internal enum CommandName {
    case CONNECT, JOIN, ADD_TRACK, REMOVE_TRACK, RENEGOTIATE, LEAVE
}

internal enum ClientState {
    case CREATED, CONNECTED, JOINED
}

internal class Command {
    let commandName: CommandName
    let clientStateAfterCommand: ClientState?
    let workItem: DispatchWorkItem

    init(commandName: CommandName, clientStateAfterCommand: ClientState?, block: @escaping () -> Void) {
        self.commandName = commandName
        self.clientStateAfterCommand = clientStateAfterCommand
        self.workItem = DispatchWorkItem {
            block()
        }
    }

    func execute() {
        DispatchQueue.main.async(execute: workItem)
    }
}
