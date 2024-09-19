import WebRTC

public protocol LocalScreenBroadcastTrackDelegate: AnyObject {
    func started()
    func stopped()
    func paused()
    func resumed()
}

/// Utility wrapper around a local `RTCVideoTrack` also managing a `BroadcastScreenCapturer`.
public class LocalScreenShareTrack: VideoTrack, LocalTrack, ScreenBroadcastCapturerDelegate {
    private let appGroup: String
    internal var capturer: ScreenBroadcastCapturer
    internal var videoParameters: VideoParameters
    internal var videoSource: RTCVideoSource
    public weak var delegate: LocalScreenBroadcastTrackDelegate?

    internal init(
        mediaTrack: RTCVideoTrack, videoSource: RTCVideoSource, endpointId: String, metadata: Metadata = Metadata(),
        appGroup: String,
        videoParameters: VideoParameters,
        delegate: LocalScreenBroadcastTrackDelegate? = nil
    ) {
        self.appGroup = appGroup
        self.videoParameters = videoParameters
        self.delegate = delegate
        self.videoSource = videoSource
        self.capturer = ScreenBroadcastCapturer(videoSource, appGroup: appGroup, videoParameters: videoParameters)
        super.init(mediaTrack: mediaTrack, endpointId: endpointId, rtcEngineId: nil, metadata: metadata)
        capturer.capturerDelegate = self
    }

    internal init(mediaTrack: RTCVideoTrack, oldTrack: LocalScreenShareTrack) {
        self.appGroup = oldTrack.appGroup
        self.videoParameters = oldTrack.videoParameters
        self.delegate = oldTrack.delegate
        self.videoSource = oldTrack.videoSource
        self.capturer = ScreenBroadcastCapturer(
            oldTrack.videoSource, appGroup: oldTrack.appGroup, videoParameters: oldTrack.videoParameters)
        super.init(
            mediaTrack: mediaTrack, endpointId: oldTrack.endpointId, rtcEngineId: nil, metadata: oldTrack.metadata)
        capturer.capturerDelegate = self
    }

    func start() {
        capturer.startCapture()
    }

    func stop() {
        capturer.stopCapture()
    }

    internal func started() {
        delegate?.started()
    }

    internal func stopped() {
        delegate?.stopped()
    }

    public func paused() {
        delegate?.paused()
    }

    public func resumed() {
        delegate?.resumed()
    }
}
