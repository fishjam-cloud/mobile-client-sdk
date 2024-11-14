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
                listener.onConnected(endpointId: connected.endpointID, otherEndpoints: connected.endpoints)
            }
        case .endpointAdded(let endpointAdded):
            for listener in listeners {
                listener.onEndpointAdded(
                    endpointId: endpointAdded.endpointID,
                    metadata: endpointAdded.metadata)
            }
        case .endpointRemoved(let endpointRemoved):
            for listener in listeners {

                listener.onEndpointRemoved(endpointId: endpointRemoved.endpointID)
            }
        case .endpointUpdated(let endpointUpdated):
            for listener in listeners {
                listener.onEndpointUpdated(
                    endpointId: endpointUpdated.endpointID, metadata: endpointUpdated.metadata)
            }
        case .offerData(let offerData):
            for listener in listeners {
                listener.onOfferData(
                    integratedTurnServers: offerData.data.integratedTurnServers, tracksTypes: offerData.data.tracksTypes
                )
            }
        case .candidate(let candidate):
            for listener in listeners {
                let sdpMid = candidate.data.sdpMid.map(String.init)

                listener.onRemoteCandidate(
                    candidate: candidate.data.candidate, sdpMLineIndex: candidate.data.sdpMLineIndex,
                    sdpMid: sdpMid)
            }
        case .tracksAdded(let tracksAdded):
            for listener in listeners {

                listener.onTracksAdded(
                    endpointId: tracksAdded.data.endpointId, tracks: tracksAdded.data.tracks)
            }
        case .tracksRemoved(let tracksRemoved):
            for listener in listeners {

                listener.onTracksRemoved(
                    endpointId: tracksRemoved.data.endpointId, trackIds: tracksRemoved.data.trackIds)
            }
        case .trackUpdated(let tracksUpdated):
            for listener in listeners {

                listener.onTrackUpdated(
                    endpointId: tracksUpdated.data.endpointId, trackId: tracksUpdated.data.trackId,
                    metadata: tracksUpdated.data.metadata ?? AnyJson())
            }
        case .sdpAnswer(let sdpAnswer):
            for listener in listeners {

                listener.onSdpAnswer(
                    type: sdpAnswer.data.type, sdp: sdpAnswer.data.sdp, midToTrackId: sdpAnswer.data.midToTrackId)
            }
        case .vadNotification(let vadNotification):
            for listener in listeners {

                listener.onVadNotification(trackId: vadNotification.data.trackId, status: vadNotification.data.status)
            }
        default:
            sdkLogger.error("Failed to handle ReceivableEvent of type \(event.type)")
            return
        }
    }
}
