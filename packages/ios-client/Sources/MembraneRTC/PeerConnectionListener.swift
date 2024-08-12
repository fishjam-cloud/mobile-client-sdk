import WebRTC

internal protocol PeerConnectionListener: AnyObject {
    func onAddTrack(trackId: String, track: RTCMediaStreamTrack)
    func onLocalIceCandidate(candidate: RTCIceCandidate)
    func onPeerConnectionStateChange(newState: RTCIceConnectionState)
}
