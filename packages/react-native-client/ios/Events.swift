enum PeerStatus: String {
    case connecting
    case connected
    case error
    case idle
}

enum EmitableEvents: String, CaseIterable {
    case IsCameraOn
    case IsMicrophoneOn
    case IsScreenShareOn
    case IsAppScreenShareOn
    case SimulcastConfigUpdate
    case PeersUpdate
    case AudioDeviceUpdate
    case SendMediaEvent
    case BandwidthEstimation
    case ReconnectionRetriesLimitReached
    case ReconnectionStarted
    case Reconnected
    case Warning
    case PeerStatusChanged
    case CurrentCameraChanged

    var name: String {
        rawValue
    }

    static var allEvents: [String] {
        EmitableEvents.allCases.map(\.name)
    }
}
