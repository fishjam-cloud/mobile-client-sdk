//DONE ?

import WebRTC

/// Utility wrapper around a local `RTCVideoTrack` also managing an instance of `VideoCapturer`
public class LocalVideoTrack: VideoTrack, LocalTrack {
    internal var capturer: CameraCapturer
    internal var videoParameters: VideoParameters

    internal init(
        mediaTrack: RTCVideoTrack, endpointId: String, metadata: Metadata = Metadata(),
        videoParameters: VideoParameters, capturer: CameraCapturer
    ) {
        self.videoParameters = videoParameters
        self.capturer = capturer
        super.init(mediaTrack: mediaTrack, endpointId: endpointId, rtcEngineId: nil, metadata: metadata)
    }

    internal var mirrorVideo: (_ shouldMirror: Bool) -> Void = { _ in } {
        didSet {
            capturer.mirrorVideo = mirrorVideo
        }
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
