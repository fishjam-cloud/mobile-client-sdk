import WebRTC

/// Utility wrapper around a local `RTCVideoTrack` also managing an instance of `VideoCapturer`
public class LocalAppScreenShareTrack: LocalVideoTrack, LocalTrack {
    internal var capturer: AppScreenShareCapturer

    internal init(
        mediaTrack: RTCVideoTrack,
        videoSource: RTCVideoSource,
        endpointId: String,
        metadata: Metadata = Metadata(),
        videoParameters: VideoParameters,
        capturer: AppScreenShareCapturer

    ) {
        mediaTrack.shouldReceive = false
        self.capturer = capturer
        super.init(
            mediaTrack: mediaTrack,
            videoSource: videoSource,
            endpointId: endpointId,
            rtcEngineId: nil,
            videoParameters: videoParameters,
            metadata: metadata
        )
    }

    public func start() {
        capturer.startCapture()
    }

    public func stop() {
        capturer.stopCapture()
    }
}
