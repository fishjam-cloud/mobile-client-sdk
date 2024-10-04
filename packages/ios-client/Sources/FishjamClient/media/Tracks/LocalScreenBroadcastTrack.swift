import WebRTC

/// Utility wrapper around a local `RTCVideoTrack` also managing a `BroadcastScreenCapturer`.
public class LocalScreenBroadcastTrack: VideoTrack, LocalTrack {
    private let appGroup: String
    internal var videoParameters: VideoParameters
    internal var videoSource: RTCVideoSource

    internal init(
        mediaTrack: RTCVideoTrack, videoSource: RTCVideoSource, endpointId: String, metadata: Metadata = Metadata(),
        appGroup: String,
        videoParameters: VideoParameters
    ) {
        self.appGroup = appGroup
        self.videoParameters = videoParameters
        self.videoSource = videoSource
        super.init(mediaTrack: mediaTrack, endpointId: endpointId, rtcEngineId: nil, metadata: metadata)
    }

    internal init(mediaTrack: RTCVideoTrack, oldTrack: LocalScreenBroadcastTrack) {
        self.appGroup = oldTrack.appGroup
        self.videoParameters = oldTrack.videoParameters
        self.videoSource = oldTrack.videoSource
        super.init(
            mediaTrack: mediaTrack, endpointId: oldTrack.endpointId, rtcEngineId: nil, metadata: oldTrack.metadata)
    }

    func start() {}

    func stop() {}
}
