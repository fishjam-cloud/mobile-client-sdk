import WebRTC

/// Utility wrapper around a local `RTCVideoTrack` also managing an instance of `VideoCapturer`
public class LocalScreenAppTrack: VideoTrack, LocalTrack {
    internal var capturer: ScreenAppCapturer
    internal var videoParameters: VideoParameters
    internal var videoSource: RTCVideoSource

    internal init(
        mediaTrack: RTCVideoTrack, videoSource: RTCVideoSource, endpointId: String, metadata: Metadata = Metadata(),
        videoParameters: VideoParameters, capturer: ScreenAppCapturer

    ) {
        mediaTrack.shouldReceive = false
        self.videoParameters = videoParameters
        self.capturer = capturer
        self.videoSource = videoSource
        super.init(mediaTrack: mediaTrack, endpointId: endpointId, rtcEngineId: nil, metadata: metadata)
    }

    convenience internal init(mediaTrack: RTCVideoTrack, oldTrack: LocalScreenAppTrack) {
        self.init(
            mediaTrack: mediaTrack, videoSource: oldTrack.videoSource, endpointId: oldTrack.endpointId,
            metadata: oldTrack.metadata, videoParameters: oldTrack.videoParameters, capturer: oldTrack.capturer)
    }

    public func start() {
        capturer.startCapture()
    }

    public func stop() {
        capturer.stopCapture()
    }
}
