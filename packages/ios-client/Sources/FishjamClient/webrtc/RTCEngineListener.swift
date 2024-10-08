internal protocol RTCEngineListener: AnyObject {
    func onSendMediaEvent(event: SerializedMediaEvent)
    func onConnected(endpointId: String, otherEndpoints: [EventEndpoint])
    func onEndpointAdded(endpointId: String, type: EndpointType, metadata: Metadata?)
    func onEndpointRemoved(endpointId: String)
    func onEndpointUpdated(endpointId: String, metadata: Metadata?)
    func onOfferData(integratedTurnServers: [OfferDataEvent.TurnServer], tracksTypes: [String: Int])
    func onSdpAnswer(type: String, sdp: String, midToTrackId: [String: String])
    func onRemoteCandidate(candidate: String, sdpMLineIndex: Int32, sdpMid: String?)
    func onTracksAdded(endpointId: String, tracks: [String: TrackData])
    func onTracksRemoved(endpointId: String, trackIds: [String])
    func onTrackUpdated(endpointId: String, trackId: String, metadata: Metadata)
    func onTrackEncodingChanged(endpointId: String, trackId: String, encoding: String, encodingReason: String)
    func onVadNotification(trackId: String, status: String)
    func onBandwidthEstimation(estimation: Int)
}
