import WebRTC

public class LocalCustomVideoTrack: LocalVideoTrack, LocalTrack {
    internal init(
        mediaTrack: RTCVideoTrack, videoSource: RTCVideoSource, endpointId: String, metadata: Metadata = Metadata(),
        videoParameters: VideoParameters
    ) {
      super.init(mediaTrack: mediaTrack, videoSource: videoSource, endpointId: endpointId, rtcEngineId: nil, videoParameters: videoParameters, metadata: metadata)
    }

    func start() {}

    func stop() {}
}
