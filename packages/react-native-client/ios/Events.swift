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
        case Warning
        case PeerStatusChanged
        case ReconnectionStatusChanged
        case CurrentCameraChanged
        case TrackAspectRatioUpdated

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

    static func currentCameraChanged(localCamera: LocalCamera?, isCameraOn: Bool, isCameraInitialized: Bool)
        -> EmitableEvent
    {
        return .init(
            event: .CurrentCameraChanged,
            eventContent: [
                "currentCamera": localCamera as Any,
                "isCameraOn": isCameraOn,
                "isCameraInitialized": isCameraInitialized,
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

    static func peersUpdate() -> EmitableEvent {
        return .init(event: .PeersUpdate)
    }

    static func trackAspectRatioUpdated(trackId: String, aspectRatio: AspectRatio) -> EmitableEvent {
        return .init(
            event: .TrackAspectRatioUpdated,
            eventContent: [
                "trackId": trackId,
                "aspectRatio": aspectRatio.toDict(),
            ])
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
