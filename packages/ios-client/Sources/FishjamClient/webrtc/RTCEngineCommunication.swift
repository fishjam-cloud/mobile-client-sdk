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
        var connect = Fishjam_MediaEvents_Peer_MediaEvent.Connect()
        connect.metadataJson = metadata.toJsonStringOrEmpty
        sendEvent(event: .connect(connect))
    }

    func disconnect() {
        sendEvent(event: .disconnect(.init()))
    }

    func updateEndpointMetadata(metadata: Metadata) {
        var updateEndpointMetadata = Fishjam_MediaEvents_Peer_MediaEvent.UpdateEndpointMetadata()
        updateEndpointMetadata.metadataJson = metadata.toJsonStringOrEmpty
        sendEvent(event: .updateEndpointMetadata(updateEndpointMetadata))
    }

    func updateTrackMetadata(trackId: String, trackMetadata: Metadata) {
        var updateTrackMetadata = Fishjam_MediaEvents_Peer_MediaEvent.UpdateTrackMetadata()
        updateTrackMetadata.metadataJson = trackMetadata.toJsonStringOrEmpty
        updateTrackMetadata.trackID = trackId
        sendEvent(event: .updateTrackMetadata(updateTrackMetadata))
    }

    func setTargetTrackEncoding(trackId: String, encoding: TrackEncoding) {
        //TODO: This will be useful after simulcast is enabled
    }

    func renegotiateTracks() {
        sendEvent(event: .renegotiateTracks(.init()))
    }

    func localCandidate(sdp: String, sdpMLineIndex: Int32, sdpMid: Int32, usernameFragment: String) {
        var candidate = Fishjam_MediaEvents_Candidate()
        candidate.candidate = sdp
        candidate.sdpMLineIndex = sdpMLineIndex
        candidate.sdpMid = String(sdpMid)
        candidate.usernameFragment = usernameFragment

        sendEvent(event: .candidate(candidate))
    }

    func sdpOffer(
        sdp: String, trackIdToTrackMetadata: [String: Metadata], midToTrackId: [String: String],
        trackIdToBitrates: [String: Int32]
    ) {
        var sdpOffer = Fishjam_MediaEvents_Peer_MediaEvent.SdpOffer()

        let encodedOffer =
            String(data: (try? JSONEncoder().encode(["sdp": sdp, "type": "offer"])) ?? .init(), encoding: .utf8) ?? ""

        sdpOffer.sdpOffer = encodedOffer
        sdpOffer.trackIDToMetadataJson = trackIdToTrackMetadata.toJsonStringOrEmpty
        sdpOffer.midToTrackID = midToTrackId
        sdpOffer.trackIDToBitrates = trackIdToBitrates

        sendEvent(event: .sdpOffer(sdpOffer))
    }

    private func sendEvent(event: Fishjam_MediaEvents_Peer_MediaEvent.OneOf_Content) {
        for listener in listeners {
            listener.onSendMediaEvent(event: event)
        }
    }

    func onEvent(event: Fishjam_MediaEvents_Server_MediaEvent) {
        guard let content = event.content else { return }

        print("********* EVENT RECEIVED *********")
        print(Mirror(reflecting: event).children.first)
        print("*********  EVENT RECEIVED END  *********")

        switch content {
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
                    endpointId: endpointUpdated.endpointID,
                    metadata: endpointUpdated.metadata.json.toAnyJson() ?? Metadata())
            }
        case .offerData(let offerData):
            for listener in listeners {
                listener.onOfferData(
                    tracksTypes: offerData.tracksTypes
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
                    sdpAnswer: sdpAnswer.sdpAnswer,
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
        case .error(let error):
            sdkLogger.error("Failed to handle event. Message: \(error.message)")

        }
    }
}
