import WebRTC

/// Utility wrapper around a local `RTCVideoTrack` also managing an instance of `VideoCapturer`
public class LocalVideoTrack: VideoTrack, LocalTrack {
    internal var capturer: CameraCapturer
    internal var videoParameters: VideoParameters
    internal var videoSource: RTCVideoSource

    internal init(
        mediaTrack: RTCVideoTrack, videoSource: RTCVideoSource, endpointId: String, metadata: Metadata = Metadata(),
        videoParameters: VideoParameters, capturer: CameraCapturer

    ) {
        self.videoParameters = videoParameters
        self.capturer = capturer
        self.videoSource = videoSource
        super.init(mediaTrack: mediaTrack, endpointId: endpointId, rtcEngineId: nil, metadata: metadata)
    }

    convenience internal init(mediaTrack: RTCVideoTrack, oldTrack: LocalVideoTrack) {
        self.init(
            mediaTrack: mediaTrack, videoSource: oldTrack.videoSource, endpointId: oldTrack.endpointId,
            metadata: oldTrack.metadata, videoParameters: oldTrack.videoParameters, capturer: oldTrack.capturer)
    }

    internal var mirrorVideo: (_ shouldMirror: Bool) -> Void = { _ in } {
        didSet {
            capturer.mirrorVideo = mirrorVideo
        }
    }

    public var isFrontCamera: Bool {
        return capturer.isFront
    }

    public func start() {
        capturer.startCapture()
    }

    public func stop() {
        capturer.stopCapture()
    }

    public func flipCamera() {
        capturer.switchCamera()
    }

    public func switchCamera(deviceId: String) {
        capturer.switchCamera(deviceId: deviceId)
    }

    public static func getCaptureDevices() -> [AVCaptureDevice] {
        return RTCCameraVideoCapturer.captureDevices()
    }
}
