internal protocol RTCEngineListener: AnyObject {
    func onSendMediaEvent(event: Fishjam_MediaEvents_Peer_MediaEvent.OneOf_Content)
    func onConnected(
        endpointId: String, endpointIdToEndpoint: [String: Fishjam_MediaEvents_Server_MediaEvent.Endpoint],
        iceServers: [Fishjam_MediaEvents_Server_MediaEvent.IceServer])
    func onEndpointAdded(endpointId: String, metadata: Metadata?)
    func onEndpointRemoved(endpointId: String)
    func onEndpointUpdated(endpointId: String, metadata: Metadata?)
    func onOfferData(tracksTypes: Fishjam_MediaEvents_Server_MediaEvent.OfferData.TrackTypes)
    func onSdpAnswer(sdp: String, midToTrackId: [String: String])
    func onRemoteCandidate(candidate: String, sdpMLineIndex: Int32, sdpMid: String?)
    func onTracksAdded(endpointId: String, trackIdToTracks: [String: Fishjam_MediaEvents_Server_MediaEvent.Track])
    func onTracksRemoved(endpointId: String, trackIds: [String])
    func onTrackUpdated(endpointId: String, trackId: String, metadata: Metadata)
    func onTrackEncodingChanged(endpointId: String, trackId: String, encoding: String, encodingReason: String)
    func onVadNotification(trackId: String, status: Fishjam_MediaEvents_Server_MediaEvent.VadNotification.Status)
    func onBandwidthEstimation(estimation: Int)
}
