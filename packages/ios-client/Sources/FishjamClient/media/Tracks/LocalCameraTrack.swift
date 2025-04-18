import WebRTC

/// Utility wrapper around a local `RTCVideoTrack` also managing an instance of `VideoCapturer`
public class LocalCameraTrack: LocalVideoTrack, LocalTrack {
    private var capturer: CameraCapturer

    public weak var captureDeviceChangedListener: CameraCapturerDeviceChangedListener? {
        get {
            return capturer.captureDeviceChangedListener
        }
        set {
            capturer.captureDeviceChangedListener = newValue
        }
    }

    public var currentCaptureDevice: AVCaptureDevice? {
        return capturer.device
    }

    internal init(
        mediaTrack: RTCVideoTrack,
        videoSource: RTCVideoSource,
        endpointId: String,
        metadata: Metadata = Metadata(),
        videoParameters: VideoParameters,
        capturer: CameraCapturer

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

    override func replace(mediaTrack: RTCVideoTrack) {
        mediaTrack.shouldReceive = false
        super.replace(mediaTrack: mediaTrack)
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
