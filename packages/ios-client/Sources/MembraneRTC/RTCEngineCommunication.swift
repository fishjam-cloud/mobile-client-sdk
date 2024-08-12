import Foundation
import Promises

internal class RTCEngineCommunication {
    var listeners: [RTCEngineListener]

    init(listeners: [RTCEngineListener]) {
        self.listeners = listeners
    }

    func addListener(_ listener: RTCEngineListener) {
        listeners.append(listener)
    }

    func removeListener(_ listener: RTCEngineListener) {
        listeners.removeAll(where: { $0 === listener })
    }

    func connect(metadata: Metadata) {
        sendEvent(event: ConnectEvent(metadata: metadata))
    }
    
    func disconnect(){
        sendEvent(event: DisconnectEvent())
    }

    func updateEndpointMetadata(metadata: Metadata) {
        sendEvent(event: UpdateEndpointMetadata(metadata: metadata))
    }

    func updateTrackMetadata(trackId: String, trackMetadata: Metadata) {
        sendEvent(event: UpdateTrackMetadata(trackId: trackId, trackMetadata: trackMetadata))
    }

    func setTargetTrackEncoding(trackId: String, encoding: TrackEncoding) {
        sendEvent(event: SelectEncodingEvent(trackId: trackId, encoding: encoding.description))
    }

    func renegotiateTracks() {
        sendEvent(event: RenegotiateTracksEvent())
    }

    func localCandidate(sdp: String, sdpMLineIndex: Int32) {
        sendEvent(event: LocalCandidateEvent(candidate: sdp, sdpMLineIndex: sdpMLineIndex))
    }

    func sdpOffer(sdp: String, trackIdToTrackMetadata: [String: Metadata], midToTrackId: [String: String]) {
        sendEvent(
            event: SdpOfferEvent(sdp: sdp, trackIdToTrackMetadata: trackIdToTrackMetadata, midToTrackId: midToTrackId))
    }

    private func sendEvent(event: SendableEvent) {
        let data = try! JSONEncoder().encode(event.serialize())

        guard let dataPayload = String(data: data, encoding: .utf8) else {
            return
        }
        for listener in listeners {
            listener.onSendMediaEvent(event: dataPayload)
        }
    }

    func onEvent(serializedEvent: SerializedMediaEvent) {
        guard let event = Events.deserialize(payload: serializedEvent) else {
            sdkLogger.error("Failed to decode event \(serializedEvent)")
            return
        }
        switch event.type {
        case .Connected:
            let connected = event as! ConnectedEvent
            for listener in listeners {
                listener.onConnected(endpointId: connected.data.id, otherEndpoints: connected.data.otherEndpoints)
            }
        case .EndpointAdded:
            let endpointAdded = event as! EndpointAddedEvent
            for listener in listeners {
                listener.onEndpointAdded(
                    endpointId: endpointAdded.data.id, type: endpointAdded.data.type,
                    metadata: endpointAdded.data.metadata)
            }
        case .EndpointRemoved:
            let endpointRemoved = event as! EndpointRemovedEvent
            for listener in listeners {

                listener.onEndpointRemoved(endpointId: endpointRemoved.data.id)
            }
        case .EndpointUpdated:
            let endpointUpdated = event as! EndpointUpdatedEvent
            for listener in listeners {

                listener.onEndpointUpdated(
                    endpointId: endpointUpdated.data.endpointId, metadata: endpointUpdated.data.metadata ?? AnyJson())
            }
        case .OfferData:
            let offerData = event as! OfferDataEvent
            for listener in listeners {
                listener.onOfferData(
                    integratedTurnServers: offerData.data.integratedTurnServers, tracksTypes: offerData.data.tracksTypes
                )
            }
        case .Candidate:
            let candidate = event as! RemoteCandidateEvent
            for listener in listeners {

                listener.onRemoteCandidate(
                    candidate: candidate.data.candidate, sdpMLineIndex: candidate.data.sdpMLineIndex,
                    sdpMid: candidate.data.sdpMid)
            }
        case .TracksAdded:
            let tracksAdded = event as! TracksAddedEvent
            for listener in listeners {

                listener.onTracksAdded(
                    endpointId: tracksAdded.data.endpointId, tracks: tracksAdded.data.tracks)
            }
        case .TracksRemoved:
            let tracksRemoved = event as! TracksRemovedEvent
            for listener in listeners {

                listener.onTracksRemoved(
                    endpointId: tracksRemoved.data.endpointId, trackIds: tracksRemoved.data.trackIds)
            }
        case .TrackUpdated:
            let tracksUpdated = event as! TracksUpdatedEvent
            for listener in listeners {

                listener.onTrackUpdated(
                    endpointId: tracksUpdated.data.endpointId, trackId: tracksUpdated.data.trackId,
                    metadata: tracksUpdated.data.metadata ?? AnyJson())
            }
        case .SdpAnswer:
            let sdpAnswer = event as! SdpAnswerEvent
            for listener in listeners {

                listener.onSdpAnswer(
                    type: sdpAnswer.data.type, sdp: sdpAnswer.data.sdp, midToTrackId: sdpAnswer.data.midToTrackId)
            }
        case .EncodingSwitched:
            let encodingSwitched = event as! EncodingSwitchedEvent
            for listener in listeners {

                listener.onTrackEncodingChanged(
                    endpointId: encodingSwitched.data.endpointId, trackId: encodingSwitched.data.trackId,
                    encoding: encodingSwitched.data.encoding, encodingReason: encodingSwitched.data.reason)
            }
        case .VadNotification:
            let vadNotification = event as! VadNotificationEvent
            for listener in listeners {

                listener.onVadNotification(trackId: vadNotification.data.trackId, status: vadNotification.data.status)
            }
        case .BandwidthEstimation:
            let bandwidthEstimation = event as! BandwidthEstimationEvent
            for listener in listeners {

                listener.onBandwidthEstimation(estimation: Int(bandwidthEstimation.data.estimation))
            }
        default:
            sdkLogger.error("Failed to handle ReceivableEvent of type \(event.type)")
            return
        }
    }
}
