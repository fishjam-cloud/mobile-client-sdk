import WebRTC

open class VideoTrack: Track {
    init(
        mediaTrack: RTCVideoTrack, endpointId: String, rtcEngineId: String?, metadata: Metadata = Metadata(),
        id: String = UUID().uuidString
    ) {
        super.init(mediaTrack: mediaTrack, endpointId: endpointId, rtcEngineId: rtcEngineId, metadata: metadata, id: id)
    }

    internal var videoTrack: RTCVideoTrack {
        return self.mediaTrack as! RTCVideoTrack
    }
    /**
     * Every track can have 2 ids:
     * - the one from rtc engine in the form of <peerid>:<trackid>
     * - the one from webrtc library in the form of uuidv4 string (different than one from the engine)
     * It's always confusing when to use which one and we need to keep some kind of mapping.
     * What's worse a track might be sometimes missing one of the ids
     * - rtc engine id is missing when a local track is created without established connection
     * - webrtc id is missing when we get a track from rtc engine but is not yet negotiated
     * So we have a third id that is created by our client. It's always there, it's never changing
     * and we're always using it unless we talk to rtc engine or webrtc. The user sees just this id,
     * unless they want to debug something.
     */

    func addRenderer(_ renderer: RTCVideoRenderer) {
        videoTrack.add(renderer)
    }

    func removeRenderer(_ renderer: RTCVideoRenderer) {
        videoTrack.remove(renderer)
    }

    func shouldReceive(_ shouldReceive: Bool) {
        videoTrack.shouldReceive = shouldReceive
    }
}
