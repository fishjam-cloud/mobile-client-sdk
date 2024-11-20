import Foundation

/// Protocol for outgoing `MembraneRTC` events
public protocol SendableEvent {
    func serialize() -> Payload
}

/// Available types of incoming media events.
public enum ReceivableEventType: String, Codable {
    case Connected = "connected"
    case EndpointAdded = "endpointAdded"
    case EndpointRemoved = "endpointRemoved"
    case EndpointUpdated = "endpointUpdated"
    case Custom = "custom"
    case OfferData = "offerData"
    case Candidate = "candidate"
    case TracksAdded = "tracksAdded"
    case TracksRemoved = "tracksRemoved"
    case TrackUpdated = "trackUpdated"
    case SdpAnswer = "sdpAnswer"
    case EncodingSwitched = "encodingSwitched"
    case VadNotification = "vadNotification"
    case BandwidthEstimation = "bandwidthEstimation"
}

/// Protocol for incoming `MembraneRTC` events
public protocol ReceivableEvent {
    var type: ReceivableEventType { get }
}

internal struct ReceivableEventBase: Decodable {
    let type: ReceivableEventType
}

struct SdpAnswer: Decodable {
    let sdp: String
    let type: String
}

public enum Events {
    internal static func decodeEvent<T: Decodable>(from data: Data) -> T? {
        do {
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            sdkLogger.error("failed to decode an event: \(error)")
            return nil
        }
    }

    /*
     Deserialization of incoming events is quite specific.

     Each incoming event is of given format:
     ```
     {
        "type": "(dedicated event name)",
        "data": "arbitrary event's payload object"
     }
     ```

     It is quite problematic as we have to decode each event twice. Once to get the event's type,
     and when we know the type we can decode the event's data payload (due to static typing
     we need to explicitly call decode with generic parameter).

     A subset of events are embeded inside of one specific event of type "custom".
     In this case the "data" payload contains a whole new event on its own:
     ```
     {
        "type": "custom",
        "data": {
            "type": "(dedicated event name)",
            "data": "arbitrary event's payload object"
        }
     }
     ```

     This time we are basically performing the deserialization 3 times:
     - to recognize "custom" type
     - to recognize the nested event's type
     - to finally deserialize the payload into an explicit event
     */
    public static func deserialize(payload: String) -> ReceivableEvent? {
        let data = payload.data(using: .utf8)!

        guard let base: ReceivableEventBase = decodeEvent(from: data) else {
            sdkLogger.error("Failed to decode ReceivableEventBase")
            return nil
        }

        switch base.type {
        case .Connected:
            let event: ConnectedEvent? = decodeEvent(from: data)

            return event

        case .EndpointAdded:
            let event: EndpointAddedEvent? = decodeEvent(from: data)

            return event

        case .EndpointRemoved:
            let event: EndpointRemovedEvent? = decodeEvent(from: data)

            return event

        case .EndpointUpdated:
            let event: EndpointUpdatedEvent? = decodeEvent(from: data)

            return event

        case .TracksAdded:
            let event: TracksAddedEvent? = decodeEvent(from: data)

            return event

        case .TracksRemoved:
            let event: TracksRemovedEvent? = decodeEvent(from: data)

            return event

        case .TrackUpdated:
            let event: TracksUpdatedEvent? = decodeEvent(from: data)

            return event

        case .Custom:
            guard let baseEvent: BaseCustomEvent = decodeEvent(from: data) else {
                return nil
            }

            switch baseEvent.data.type {
            case .OfferData:
                guard let event: CustomEvent<OfferDataEvent> = decodeEvent(from: data) else {
                    return nil
                }

                return event.data

            case .Candidate:
                guard let event: CustomEvent<RemoteCandidateEvent> = decodeEvent(from: data) else {
                    return nil
                }

                return event.data

            case .SdpAnswer:
                guard let event: CustomEvent<SdpAnswerEvent> = decodeEvent(from: data) else {
                    return nil
                }

                return event.data

            case .EncodingSwitched:
                guard let event: CustomEvent<EncodingSwitchedEvent> = decodeEvent(from: data) else {
                    return nil
                }

                return event.data

            case .VadNotification:
                guard let event: CustomEvent<VadNotificationEvent> = decodeEvent(from: data) else {
                    return nil
                }

                return event.data

            case .BandwidthEstimation:
                guard let event: CustomEvent<BandwidthEstimationEvent> = decodeEvent(from: data) else {
                    return nil
                }

                return event.data

            default:
                sdkLogger.warning("Unhandled custom event parsing for \(baseEvent.data.type)")

                return nil
            }
        default:
            return nil
        }
    }
}

/*
 Sendable events
 */
struct ConnectEvent: SendableEvent {
    let metadata: Metadata?

    func serialize() -> Payload {
        return .init([
            "type": "connect",
            "data": ["metadata": metadata],
        ])
    }
}

struct DisconnectEvent: SendableEvent {
    func serialize() -> Payload {
        .init([
            "type": "disconnect"
        ])
    }
}

struct SdpOfferEvent: SendableEvent {
    let sdp: String
    let trackIdToTrackMetadata: [String: Metadata?]
    let midToTrackId: [String: String]

    func serialize() -> Payload {
        return .init([
            "type": "custom",
            "data": [
                "type": "sdpOffer",
                "data": [
                    "sdpOffer": [
                        "type": "offer",
                        "sdp": sdp,
                    ],
                    "trackIdToTrackMetadata": trackIdToTrackMetadata,
                    "midToTrackId": midToTrackId,
                ] as [String: Any],
            ] as [String: Any],
        ])
    }
}

struct LocalCandidateEvent: SendableEvent {
    let candidate: String
    let sdpMLineIndex: Int32
    let sdpMid: Int32?
    let usernameFragment: String?

    func serialize() -> Payload {
        return .init([
            "type": "custom",
            "data": [
                "type": "candidate",
                "data": [
                    "candidate": candidate,
                    "sdpMLineIndex": sdpMLineIndex,
                    "sdpMid": sdpMid,
                    "usernameFragment": usernameFragment,
                ] as [String: Any],
            ] as [String: Any],
        ])
    }
}

struct RenegotiateTracksEvent: SendableEvent {
    func serialize() -> Payload {
        return .init([
            "type": "custom",
            "data": [
                "type": "renegotiateTracks"
            ],
        ])
    }
}

struct SelectEncodingEvent: SendableEvent {
    let trackId: String
    let encoding: String

    func serialize() -> Payload {
        return .init([
            "type": "custom",
            "data": [
                "type": "setTargetTrackVariant",
                "data": [
                    "trackId": trackId,
                    "variant": encoding,
                ],
            ] as [String: Any],
        ])
    }
}

struct UpdateEndpointMetadata: SendableEvent {
    let metadata: Metadata?

    func serialize() -> Payload {
        return .init([
            "type": "updatePeerMetadata",
            "data": ["metadata": metadata],
        ])
    }
}

struct UpdateTrackMetadata: SendableEvent {
    let trackId: String
    let trackMetadata: Metadata?

    func serialize() -> Payload {
        return .init([
            "type": "updateTrackMetadata",
            "data": ["trackId": trackId, "trackMetadata": trackMetadata!] as [String: Any],
        ])
    }
}

/*
 Receivable events
 */
struct EventEndpoint: Codable {
    let id: String
    let type: String
    let metadata: Metadata?
    let tracks: [String: TrackData]
}

struct ConnectedEvent: ReceivableEvent, Codable {
    struct Data: Codable {
        let id: String
        let otherEndpoints: [EventEndpoint]
    }

    let type: ReceivableEventType
    let data: Data
}

struct EndpointAddedEvent: ReceivableEvent, Codable {
    struct Data: Codable {
        let id: String
        let metadata: Metadata?
        let tracks: [String: TrackData]?
    }

    let type: ReceivableEventType
    let data: Data
}

struct EndpointRemovedEvent: ReceivableEvent, Codable {
    struct Data: Codable {
        let id: String
    }

    let type: ReceivableEventType
    let data: Data
}

struct EndpointUpdatedEvent: ReceivableEvent, Codable {
    struct Data: Codable {
        let endpointId: String
        let metadata: Metadata?
    }

    let type: ReceivableEventType
    let data: Data
}

struct OfferDataEvent: ReceivableEvent, Codable {
    struct TurnServer: Codable {
        let username: String
        let password: String
        let serverAddr: String
        let serverPort: UInt32
        let transport: String
    }

    struct Data: Codable {
        let integratedTurnServers: [TurnServer]
        let tracksTypes: [String: Int]
    }

    let type: ReceivableEventType
    let data: Data
}

public struct TracksAddedEvent: ReceivableEvent, Codable {
    public struct Data: Codable {
        let endpointId: String
        let tracks: [String: TrackData]
    }

    public let type: ReceivableEventType
    public let data: Data
}

struct TracksRemovedEvent: ReceivableEvent, Codable {
    struct Data: Codable {
        let endpointId: String
        let trackIds: [String]
    }

    let type: ReceivableEventType
    let data: Data
}

struct TracksUpdatedEvent: ReceivableEvent, Codable {
    struct Data: Codable {
        let endpointId: String
        let trackId: String
        let metadata: Metadata?
    }

    let type: ReceivableEventType
    let data: Data
}

struct SdpAnswerEvent: ReceivableEvent, Codable {
    struct Data: Codable {
        let type: String
        let sdp: String
        let midToTrackId: [String: String]
    }

    let type: ReceivableEventType
    let data: Data
}

struct RemoteCandidateEvent: ReceivableEvent, Codable {
    struct Data: Codable {
        let candidate: String
        let sdpMLineIndex: Int32
        let sdpMid: Int32?
        let usernameFragment: String?
    }

    let type: ReceivableEventType
    let data: Data
}

struct EncodingSwitchedEvent: ReceivableEvent, Codable {
    struct Data: Codable {
        let endpointId: String
        let trackId: String
        let encoding: String
        let reason: String
    }

    let type: ReceivableEventType
    let data: Data
}

struct VadNotificationEvent: ReceivableEvent, Codable {
    struct Data: Codable {
        let trackId: String
        let status: String
    }

    let type: ReceivableEventType
    let data: Data
}

struct BandwidthEstimationEvent: ReceivableEvent, Codable {
    struct Data: Codable {
        let estimation: Double
    }

    let type: ReceivableEventType
    let data: Data
}

// This is kinda strange as we can't dynamically decode json strings to structs
// e.g. to [String: Any] type
// Therefore we need to preform a 2-phase decoding, meaning that we need to extract types first
// and then based on them statically decode embedded events
struct BaseCustomEvent: ReceivableEvent, Codable {
    struct Data: Codable {
        let type: ReceivableEventType
    }

    let type: ReceivableEventType
    let data: Data
}

struct CustomEvent<EventType: ReceivableEvent & Codable>: ReceivableEvent, Codable {
    let type: ReceivableEventType
    let data: EventType
}
