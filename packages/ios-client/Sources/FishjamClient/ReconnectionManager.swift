import Foundation

enum ReconnectionStatus {
    case IDLE
    case RECONNECTING
    case WAITING
    case ERROR
}

public struct ReconnectConfig {
    let maxAttempts: Int
    let initialDelayMs: Int
    let delayMs: Int

    public init(maxAttempts: Int = 5, initialDelayMs: Int = 1000, delayMs: Int = 1000) {
        self.maxAttempts = maxAttempts
        self.initialDelayMs = initialDelayMs
        self.delayMs = delayMs
    }
}

public protocol ReconnectionManagerListener {
    func onReconnectionStarted()
    func onReconnected()
    func onReconnectionRetriesLimitReached()
}

class ReconnectionManager {
    private let reconnectConfig: ReconnectConfig
    private var reconnectAttempts = 0
    var reconnectionStatus = ReconnectionStatus.IDLE
    private let connect: () -> Void
    private var listener: ReconnectionManagerListener

    init(reconnectConfig: ReconnectConfig, connect: @escaping () -> Void, listener: ReconnectionManagerListener) {
        self.reconnectConfig = reconnectConfig
        self.connect = connect
        self.listener = listener
    }

    func onDisconnected() {
        if reconnectAttempts >= reconnectConfig.maxAttempts {
            reconnectionStatus = .ERROR
            listener.onReconnectionRetriesLimitReached()
            return
        }

        if reconnectionStatus == .WAITING {
            return
        }

        if reconnectionStatus != .RECONNECTING {
            reconnectionStatus = .RECONNECTING
            listener.onReconnectionStarted()
        }
        let delay = (reconnectConfig.initialDelayMs + reconnectAttempts * reconnectConfig.delayMs)
        reconnectAttempts += 1

        reconnectionStatus = .WAITING

        DispatchQueue.main.asyncAfter(
            deadline: .now() + DispatchTimeInterval.milliseconds(delay),
            execute: {
                self.reconnectionStatus = .RECONNECTING
                self.connect()
            })
    }

    func onReconnected() {
        if reconnectionStatus != .RECONNECTING {
            return
        }
        reset()
        listener.onReconnected()
    }

    func reset() {
        reconnectAttempts = 0
        reconnectionStatus = .IDLE
    }
}
