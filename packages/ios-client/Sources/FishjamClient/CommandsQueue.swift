import Promises
internal class CommandsQueue{
    var clientState: ClientState = ClientState.CREATED
    private var commandsQueue: [Command] = []
    
    func addCommand(_ command: Command) -> DispatchWorkItem {
        commandsQueue.append(command)
        if(commandsQueue.count == 1){
            command.execute()
        }
        return command.workItem
    }
    
    func finishCommand(){
        guard !(commandsQueue.isEmpty) else{ return }
        let command = commandsQueue.first
        command?.workItem.wait()
        commandsQueue.removeFirst()
        if let nextState = command?.clientStateAfterCommand{
            clientState = nextState
        }
        if let nextCommand = commandsQueue.first{
            nextCommand.execute()
        }
        
    }
    
    func finishCommand(commandName: CommandName){
        if let command = commandsQueue.first, command.commandName == commandName{
            finishCommand()
        }
    }
    
    func finishCommand(commandNames: [CommandName]){
        if let command = commandsQueue.first, commandNames.contains(command.commandName){
            finishCommand()
        }
    }
    
    func clear(){
        clientState = .CREATED
        commandsQueue.forEach{ command in
            command.workItem.cancel()
        }
    }
    
}

//internal class CommandsQueue {
//  private var commandsQueue: ArrayDeque<Command> = ArrayDeque()
//  var clientState: ClientState = ClientState.CREATED
//
//  fun addCommand(command: Command): Job {
//    commandsQueue.add(command)
//    if (commandsQueue.size == 1) {
//      command.execute()
//    }
//    return command.job
//  }
//
//  fun finishCommand() {
//    val command = commandsQueue.first()
//    val job = command.job
//    commandsQueue.removeFirst()
//    if (command.clientStateAfterCommand != null) {
//      clientState = command.clientStateAfterCommand
//    }
//    job.complete()
//    // TODO: make it iterative, not recursive?
//    if (commandsQueue.isNotEmpty()) {
//      commandsQueue.first().execute()
//    }
//  }
//
//  fun finishCommand(commandName: CommandName) {
//    if (commandsQueue.isNotEmpty() && commandsQueue.first().commandName == commandName) {
//      finishCommand()
//    }
//  }
//
//  fun finishCommand(commandNames: List<CommandName>) {
//    if (commandsQueue.isNotEmpty() && commandNames.contains(commandsQueue.first().commandName)) {
//      finishCommand()
//    }
//  }
//
//  fun clear(cause: String) {
//    clientState = ClientState.CREATED
//    commandsQueue.forEach { command -> command.job.cancel(CancellationException(cause)) }
//    commandsQueue.clear()
//  }
//}

