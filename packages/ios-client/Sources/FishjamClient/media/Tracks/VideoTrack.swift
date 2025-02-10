import WebRTC

public protocol VideoTrackDelegate: AnyObject {
    func didChange(dimensions: Dimensions)
}

open class VideoTrack: Track, RTCVideoViewDelegate {
    init(
        mediaTrack: RTCVideoTrack, endpointId: String, rtcEngineId: String?, metadata: Metadata = Metadata(),
        id: String = UUID().uuidString
    ) {
        super.init(mediaTrack: mediaTrack, endpointId: endpointId, rtcEngineId: rtcEngineId, metadata: metadata, id: id)
    }

    var videoTrack: RTCVideoTrack {
        return self.mediaTrack as! RTCVideoTrack
    }

    weak var delegate: VideoTrackDelegate?

    public private(set) var dimensions: Dimensions?
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

    func addRenderer(_ renderer: RTCMTLVideoView) {
        videoTrack.add(renderer)
        renderer.delegate = self
    }

    func removeRenderer(_ renderer: RTCMTLVideoView) {
        videoTrack.remove(renderer)
        renderer.delegate = nil
    }

    func shouldReceive(_ shouldReceive: Bool) {
        videoTrack.shouldReceive = shouldReceive
    }

    public func videoView(_ videoView: any RTCVideoRenderer, didChangeVideoSize size: CGSize) {
        guard let width = Int32(exactly: size.width),
            let height = Int32(exactly: size.height)
        else {
            // CGSize is used by WebRTC but this should always be an integer
            sdkLogger.error("VideoView: size width/height is not an integer")
            return
        }

        guard width > 1, height > 1 else {
            // Handle known issue where the delegate (rarely) reports dimensions of 1x1
            // which causes [MTLTextureDescriptorInternal validateWithDevice] to crash.
            return
        }

        let newDimensions = Dimensions(
            width: width,
            height: height
        )

        guard newDimensions != dimensions else { return }

        DispatchQueue.main.async { [weak self] in
            guard let self else { return }

            self.dimensions = newDimensions
            self.delegate?.didChange(dimensions: newDimensions)
        }
    }
}
