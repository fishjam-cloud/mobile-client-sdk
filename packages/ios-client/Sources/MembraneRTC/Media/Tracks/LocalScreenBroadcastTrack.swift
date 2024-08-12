//DONE?

import WebRTC

public protocol LocalScreenBroadcastTrackDelegate: AnyObject {
    func started()
    func stopped()
    func paused()
    func resumed()
}

/// Utility wrapper around a local `RTCVideoTrack` also managing a `BroadcastScreenCapturer`.
public class LocalScreenBroadcastTrack: VideoTrack, LocalTrack, ScreenBroadcastCapturerDelegate {
    private let appGroup: String
    internal var capturer: ScreenBroadcastCapturer
    internal var videoParameters: VideoParameters
    public weak var delegate: LocalScreenBroadcastTrackDelegate?

    internal init(
        mediaTrack: RTCVideoTrack, mediaSource: RTCVideoSource, endpointId: String, metadata: Metadata = Metadata(),
        appGroup: String,
        videoParameters: VideoParameters,
        delegate: LocalScreenBroadcastTrackDelegate? = nil
    ) {
        self.appGroup = appGroup
        self.videoParameters = videoParameters
        self.delegate = delegate
        self.capturer = ScreenBroadcastCapturer(mediaSource, appGroup: appGroup, videoParameters: videoParameters)
        capturer.capturerDelegate = self
        super.init(mediaTrack: mediaTrack, endpointId: endpointId, rtcEngineId: nil, metadata: metadata)
    }

    func start() {
        capturer.startCapture()
    }

    func stop() {
        capturer.startCapture()
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
