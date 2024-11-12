import AVKit
import FishjamCloudClient

enum PeerStatus: String {
    case connecting
    case connected
    case error
    case idle
}

class EmitableEvent {
    enum EventName: String, CaseIterable {
        case IsMicrophoneOn
        case IsScreenShareOn
        case IsAppScreenShareOn
        case SimulcastConfigUpdate
        case PeersUpdate
        case AudioDeviceUpdate
        case BandwidthEstimation
        case ReconnectionRetriesLimitReached
        case ReconnectionStarted
        case Reconnected
        case ReconnectionStatusChanged
        case Warning
        case PeerStatusChanged
        case CurrentCameraChanged

        var name: String {
            rawValue
        }
    }

    let event: EventName
    let eventContent: Any?

    var data: [String: Any?] {
        [event.name: eventContent]
    }

    private init(event: EventName, eventContent: Any? = nil) {
        self.event = event
        self.eventContent = eventContent
    }

    static var reconnectionRetriesLimitReached: EmitableEvent { .init(event: .ReconnectionRetriesLimitReached) }
    static var reconnectionStarted: EmitableEvent { .init(event: .ReconnectionStarted) }
    static var reconnected: EmitableEvent { .init(event: .Reconnected) }

    static func isMicrophoneOn(enabled: Bool) -> EmitableEvent { .init(event: .IsMicrophoneOn, eventContent: enabled) }
    static func isScreenShareOn(enabled: Bool) -> EmitableEvent {
        .init(event: .IsScreenShareOn, eventContent: enabled)
    }
    static func isAppScreenShareOn(enabled: Bool) -> EmitableEvent {
        .init(event: .IsAppScreenShareOn, eventContent: enabled)
    }
    static func bandwidthEstimation(estimation: Int) -> EmitableEvent {
        .init(event: .BandwidthEstimation, eventContent: estimation)
    }
    static func warning(message: String) -> EmitableEvent { .init(event: .Warning, eventContent: message) }
    static func peerStatusChanged(peerStatus: PeerStatus) -> EmitableEvent {
        .init(event: .PeerStatusChanged, eventContent: peerStatus.rawValue)
    }
    static func reconnectionStatusChanged(reconnectionStatus: ReconnectionStatus) -> EmitableEvent {
        .init(event: .ReconnectionStatusChanged, eventContent: reconnectionStatus.rawValue)
    }

    static func currentCameraChanged(localCamera: LocalCamera?, isCameraOn: Bool) -> EmitableEvent {
        return .init(
            event: .CurrentCameraChanged,
            eventContent: [
                "currentCamera": localCamera as Any,
                "isCameraOn": isCameraOn,
            ])
    }

    static func simulcastConfigUpdate(simulcastConfig: SimulcastConfig) -> EmitableEvent {
        return .init(
            event: .SimulcastConfigUpdate,
            eventContent: [
                "enabled": simulcastConfig.enabled,
                "activeEncodings": simulcastConfig.activeEncodings.map { e in e.description },
            ])
    }

    static func peersUpdate(peersData: [[String: Any?]]) -> EmitableEvent {
        return .init(event: .PeersUpdate, eventContent: peersData)
    }

    static func audioDeviceUpdate(currentRoute: AVAudioSessionRouteDescription) -> EmitableEvent {
        let output = currentRoute.outputs[0]
        let deviceType = output.portType

        let deviceTypeString =
            switch deviceType {
            case .bluetoothA2DP, .bluetoothLE, .bluetoothHFP: "bluetooth"
            case .builtInSpeaker: "speaker"
            case .builtInReceiver: "earpiece"
            case .headphones: "headphones"
            default: deviceType.rawValue
            }

        return .init(
            event: .AudioDeviceUpdate,
            eventContent: [
                "selectedDevice": ["name": output.portName, "type": deviceTypeString],
                "availableDevices": [],
            ])
    }

    static var allEvents: [String] {
        EventName.allCases.map(\.name)
    }
}
