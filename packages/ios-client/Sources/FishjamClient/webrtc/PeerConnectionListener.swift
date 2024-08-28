import WebRTC

internal protocol PeerConnectionListener: AnyObject {
    func onAddTrack(trackId: String, webrtcTrack: RTCMediaStreamTrack)
    func onLocalIceCandidate(candidate: RTCIceCandidate)
}
