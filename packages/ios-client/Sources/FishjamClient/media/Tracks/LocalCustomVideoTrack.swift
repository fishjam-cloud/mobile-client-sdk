import WebRTC

public class LocalCustomVideoTrack: VideoTrack, LocalTrack {
    internal var videoParameters: VideoParameters
    internal var videoSource: RTCVideoSource

    internal init(
        mediaTrack: RTCVideoTrack, videoSource: RTCVideoSource, endpointId: String, metadata: Metadata = Metadata(),
        videoParameters: VideoParameters
    ) {
        self.videoParameters = videoParameters
        self.videoSource = videoSource
        super.init(mediaTrack: mediaTrack, endpointId: endpointId, rtcEngineId: nil, metadata: metadata)
    }

    internal init(mediaTrack: RTCVideoTrack, oldTrack: LocalBroadcastScreenShareTrack) {
        self.videoParameters = oldTrack.videoParameters
        self.videoSource = oldTrack.videoSource
        super.init(
            mediaTrack: mediaTrack, endpointId: oldTrack.endpointId, rtcEngineId: nil, metadata: oldTrack.metadata)
    }

    func start() {}

    func stop() {}
}
