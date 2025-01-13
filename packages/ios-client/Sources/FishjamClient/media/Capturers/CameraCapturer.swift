import WebRTC

public protocol CameraCapturerDeviceChangedListener: AnyObject {
    func onCaptureDeviceChanged(_ device: AVCaptureDevice?)
}

/// `VideoCapturer` responsible for capturing device's camera.
class CameraCapturer: VideoCapturer {
    private let videoParameters: VideoParameters
    private let capturer: RTCCameraVideoCapturer
    internal var isFront: Bool = true
    private(set) var device: AVCaptureDevice? {
        didSet {
            captureDeviceChangedListener?.onCaptureDeviceChanged(device)
        }
    }
    internal var mirrorVideo: (_ shouldMirror: Bool) -> Void = { _ in }
    weak var captureDeviceChangedListener: CameraCapturerDeviceChangedListener?

    init(videoParameters: VideoParameters, delegate: RTCVideoCapturerDelegate, deviceId: String? = nil) {
        self.videoParameters = videoParameters
        self.capturer = RTCCameraVideoCapturer(delegate: delegate, captureSession: AVCaptureSession())
        let devices = RTCCameraVideoCapturer.captureDevices()

        if let newDevice = devices.first(where: { $0.uniqueID == deviceId }) {
            device = newDevice
        }
    }

    public func stopCapture() {
        capturer.stopCapture()
    }

    public func switchCamera() {
        stopCapture()

        isFront = !isFront

        let devices = RTCCameraVideoCapturer.captureDevices()

        let position: AVCaptureDevice.Position = isFront ? .front : .back

        device = devices.first(where: { $0.position == position })

        startCapture()
    }

    public func switchCamera(deviceId: String) {
        stopCapture()

        let devices = RTCCameraVideoCapturer.captureDevices()
        device = devices.first(where: { $0.uniqueID == deviceId })

        isFront = device?.position == .front

        startCapture()
    }

    public func startCapture() {
        if device == nil {
            device = RTCCameraVideoCapturer.captureDevices().first(where: { $0.position == .front })
        }

        guard let device = device else {
            return
        }
        let formats: [AVCaptureDevice.Format] = RTCCameraVideoCapturer.supportedFormats(for: device)

        let (targetWidth, targetHeight) = (
            videoParameters.dimensions.width,
            videoParameters.dimensions.height
        )

        var currentDiff = Int32.max
        var selectedFormat: AVCaptureDevice.Format = formats[0]
        var selectedDimension: Dimensions?
        for format in formats {
            let dimension = CMVideoFormatDescriptionGetDimensions(format.formatDescription)

            let diff = abs(targetWidth - dimension.width) + abs(targetHeight - dimension.height)
            if diff < currentDiff {
                selectedFormat = format
                currentDiff = diff
                selectedDimension = Dimensions(dimension)
            }
        }

        guard let dimension = selectedDimension else {
            fatalError("Could not get dimensions for video capture")
        }

        sdkLogger.info("CameraCapturer selected dimensions of \(dimension)")

        let fps = videoParameters.maxFps

        // discover FPS limits
        var minFps = 60
        var maxFps = 0
        for fpsRange in selectedFormat.videoSupportedFrameRateRanges {
            minFps = min(minFps, Int(fpsRange.minFrameRate))
            maxFps = max(maxFps, Int(fpsRange.maxFrameRate))
        }
        if fps < minFps || fps > maxFps {
            fatalError("unsported requested frame rate of (\(minFps) - \(maxFps)")
        }

        capturer.startCapture(
            with: device,
            format: selectedFormat,
            fps: fps,
            completionHandler: { _ in
                self.mirrorVideo(self.isFront)
            }
        )
    }
}
