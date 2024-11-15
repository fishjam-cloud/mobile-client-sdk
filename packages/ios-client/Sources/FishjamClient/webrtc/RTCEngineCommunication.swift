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

    func disconnect() {
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

    func localCandidate(sdp: String, sdpMLineIndex: Int32, sdpMid: Int32, usernameFragment: String) {
        sendEvent(
            event: LocalCandidateEvent(
                candidate: sdp, sdpMLineIndex: sdpMLineIndex, sdpMid: sdpMid, usernameFragment: usernameFragment))
    }

    func sdpOffer(sdp: String, trackIdToTrackMetadata: [String: Metadata], midToTrackId: [String: String]) {
        sendEvent(
            event: SdpOfferEvent(sdp: sdp, trackIdToTrackMetadata: trackIdToTrackMetadata, midToTrackId: midToTrackId))
    }

    private func sendEvent(event: SendableEvent) {
        guard let data = try? JSONEncoder().encode(event.serialize()),
            let dataPayload = String(data: data, encoding: .utf8)
        else {
            return
        }
        for listener in listeners {
            listener.onSendMediaEvent(event: dataPayload)
        }
    }

    func onEvent(eventContent: Fishjam_MediaEvents_Server_MediaEvent.OneOf_Content) {
      
        switch eventContent {
        case .connected(let connected):
            for listener in listeners {
                listener.onConnected(endpointId: connected.endpointID, endpoints: connected.endpoints)
            }
        case .endpointAdded(let endpointAdded):
            for listener in listeners {
                listener.onEndpointAdded(
                    endpointId: endpointAdded.endpointID,
                    metadata: endpointAdded.metadata.json.toAnyJson() ?? Metadata())
            }
        case .endpointRemoved(let endpointRemoved):
            for listener in listeners {

                listener.onEndpointRemoved(endpointId: endpointRemoved.endpointID)
            }
        case .endpointUpdated(let endpointUpdated):
            for listener in listeners {
                listener.onEndpointUpdated(
                    endpointId: endpointUpdated.endpointID, metadata: endpointUpdated.metadata.json.toAnyJson() ?? Metadata())
            }
        case .offerData(let offerData):
            for listener in listeners {
                listener.onOfferData(
                    integratedTurnServers: offerData.data.integratedTurnServers,
                    tracksTypes: offerData.data.tracksTypes
                )
            }
        case .candidate(let candidate):
            for listener in listeners {
                listener.onRemoteCandidate(
                    candidate: candidate.candidate,
                    sdpMLineIndex: candidate.sdpMLineIndex,
                    sdpMid: candidate.sdpMid
                )
            }
        case .tracksAdded(let tracksAdded):
            for listener in listeners {

                listener.onTracksAdded(
                    endpointId: tracksAdded.endpointID,
                    tracks: tracksAdded.tracks
                )
            }
        case .tracksRemoved(let tracksRemoved):
            for listener in listeners {

                listener.onTracksRemoved(
                    endpointId: tracksRemoved.endpointID,
                    trackIds: tracksRemoved.trackIds
                )
            }
        case .trackUpdated(let tracksUpdated):
            for listener in listeners {

                listener.onTrackUpdated(
                    endpointId: tracksUpdated.endpointID,
                    trackId: tracksUpdated.trackID,
                    metadata: tracksUpdated.metadata.json.toAnyJson() ?? Metadata()
                )
            }
        case .sdpAnswer(let sdpAnswer):
            for listener in listeners {

                listener.onSdpAnswer(
                    sdp: sdpAnswer.sdpAnswer,
                    midToTrackId: sdpAnswer.midToTrackID
                )
            }
        case .vadNotification(let vadNotification):
            for listener in listeners {

                listener.onVadNotification(
                    trackId: vadNotification.trackID,
                    status: vadNotification.status
                )
            }
        default:
            sdkLogger.error("Failed to handle ReceivableEvent of type \(event.type)")
            return
        }
    }
}
