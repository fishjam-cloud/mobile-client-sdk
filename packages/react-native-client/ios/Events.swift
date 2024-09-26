enum PeerStatus: String {
    case connecting
    case connected
    case error
    case idle
}

enum EmitableEvents: String, CaseIterable {
    case isCameraOn = "IsCameraOn"
    case isMicrophoneOn = "IsMicrophoneOn"
    case isScreenShareOn = "IsScreenShareOn"
    case simulcastConfigUpdate = "SimulcastConfigUpdate"
    case peersUpdate = "PeersUpdate"
    case audioDeviceUpdate = "AudioDeviceUpdate"
    case sendMediaEvent = "SendMediaEvent"
    case bandwidthEstimation = "BandwidthEstimation"
    case reconnectionRetriesLimitReached = "ReconnectionRetriesLimitReached"
    case reconnectionStarted = "ReconnectionStarted"
    case reconnected = "Reconnected"
    case warning = "Warning"
    case peerStatusChanged = "PeerStatusChanged"

    var name: String {
        rawValue
    }

    static var allEvents: [String] {
        EmitableEvents.allCases.map({ event in
            event.rawValue
        })
    }
}
