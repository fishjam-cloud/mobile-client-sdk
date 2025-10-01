import Promises

public enum CommandName {
    case CONNECT, JOIN, ADD_TRACK, REMOVE_TRACK, RENEGOTIATE, LEAVE
}

public enum ClientState {
    case CREATED, CONNECTED, JOINED
}

public class Command {
    let commandName: CommandName
    let clientStateAfterCommand: ClientState?
    let promise: Promise<Void>
    let block: () -> Void

    public init(commandName: CommandName, clientStateAfterCommand: ClientState?, block: @escaping () -> Void) {
        self.commandName = commandName
        self.clientStateAfterCommand = clientStateAfterCommand
        self.block = block
        self.promise = Promise<Void>.pending()
    }

    func execute() {
        DispatchQueue.fishjam.async {
            self.block()
            self.promise.fulfill(())
        }
    }
}
