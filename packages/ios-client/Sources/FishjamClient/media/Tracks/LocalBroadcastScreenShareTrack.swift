import WebRTC

/// Utility wrapper around a local `RTCVideoTrack` also managing a `BroadcastScreenCapturer`.
public class LocalBroadcastScreenShareTrack: LocalVideoTrack, LocalTrack {
    private let appGroup: String

    internal init(
        mediaTrack: RTCVideoTrack,
        videoSource: RTCVideoSource,
        endpointId: String,
        metadata: Metadata = Metadata(),
        appGroup: String,
        videoParameters: VideoParameters
    ) {
        self.appGroup = appGroup
        super.init(
            mediaTrack: mediaTrack,
            videoSource: videoSource,
            endpointId: endpointId,
            rtcEngineId: nil,
            videoParameters: videoParameters,
            metadata: metadata
        )
    }

    func start() {}

    func stop() {}
}
