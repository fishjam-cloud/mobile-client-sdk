import WebRTC

/// Utility wrapper around a local `RTCVideoTrack` also managing an instance of `VideoCapturer`
public class LocalVideoTrack: VideoTrack, LocalTrack {
    internal let videoSource: RTCVideoSource
    internal var capturer: VideoCapturer?
    private let track: RTCVideoTrack
    internal var videoParameters: VideoParameters

    public enum Capturer {
        case camera, file
    }

    internal init(
        oldTrack: LocalVideoTrack,
        peerConnectionFactoryWrapper: PeerConnectionFactoryWrapper
    ) {
        self.videoSource = oldTrack.videoSource
        self.capturer = oldTrack.capturer
        self.videoParameters = oldTrack.videoParameters
        track = peerConnectionFactoryWrapper.createVideoTrack(source: videoSource)
        super.init()
    }

    internal init(parameters: VideoParameters, peerConnectionFactoryWrapper: PeerConnectionFactoryWrapper) {
        let source = peerConnectionFactoryWrapper.createVideoSource()

        videoSource = source
        track = peerConnectionFactoryWrapper.createVideoTrack(source: source)

        self.videoParameters = parameters

        super.init()

        capturer = createCapturer(videoSource: source)
    }

    static func create(
        for capturer: Capturer, videoParameters: VideoParameters,
        peerConnectionFactoryWrapper: PeerConnectionFactoryWrapper
    ) -> LocalVideoTrack {
        switch capturer {
        case .camera:
            return LocalCameraVideoTrack(
                parameters: videoParameters, peerConnectionFactoryWrapper: peerConnectionFactoryWrapper)
        case .file:
            return LocalFileVideoTrack(
                parameters: videoParameters, peerConnectionFactoryWrapper: peerConnectionFactoryWrapper)
        }
    }

    /**
        Use this to create a local track for preview etc.
        For local track that is sent to the backend use `createVideoTrack` from MembraneRTC

         - Parameters:
            - videoParameters: The parameters used for choosing the proper camera resolution and target framerate
     */
    public static func create(videoParameters: VideoParameters) -> LocalVideoTrack {
        return create(
            for: .camera, videoParameters: videoParameters,
            peerConnectionFactoryWrapper: PeerConnectionFactoryWrapper(encoder: .DEFAULT))
    }

    internal func createCapturer(videoSource _: RTCVideoSource) -> VideoCapturer {
        fatalError("Basic LocalVideoTrack does not provide a default capturer")
    }

    public var trackID: String { track.trackId }

    public func start() {
        capturer?.startCapture()
    }

    public func stop() {
        capturer?.stopCapture()
    }

    public func enabled() -> Bool {
        return track.isEnabled
    }

    public func setEnabled(_ enabled: Bool) {
        track.isEnabled = enabled
    }

    public func trackId() -> String {
        return track.trackId
    }

    override func rtcTrack() -> RTCMediaStreamTrack {
        return track
    }
}

public class LocalCameraVideoTrack: LocalVideoTrack {
    override internal func createCapturer(videoSource: RTCVideoSource) -> VideoCapturer {
        return CameraCapturer(videoParameters: videoParameters, delegate: videoSource)
    }

    internal var mirrorVideo: (_ shouldMirror: Bool) -> Void = { _ in } {
        didSet {
            if let cap = capturer as? CameraCapturer {
                cap.mirrorVideo = mirrorVideo
            }
        }
    }

    public func switchCamera() {
        guard let capturer = capturer as? CameraCapturer else {
            return
        }

        capturer.switchCamera()
    }

    public func switchCamera(deviceId: String) {
        guard let capturer = capturer as? CameraCapturer else {
            return
        }

        capturer.switchCamera(deviceId: deviceId)

    }

    public static func getCaptureDevices() -> [AVCaptureDevice] {
        return RTCCameraVideoCapturer.captureDevices()
    }
}

public class LocalFileVideoTrack: LocalVideoTrack {
    override internal func createCapturer(videoSource: RTCVideoSource) -> VideoCapturer {
        return FileCapturer(videoSource)
    }
}
