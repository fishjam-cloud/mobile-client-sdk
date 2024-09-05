import WebRTC

/// `VideoCapturer` responsible for capturing  video from given file
class FileCapturer: VideoCapturer {
    private let capturer: RTCFileVideoCapturer

    init(_ delegate: RTCVideoCapturerDelegate) {
        capturer = RTCFileVideoCapturer(delegate: delegate)
    }

    public func startCapture() {
        if let _ = Bundle.main.path(forResource: "video.mp4", ofType: nil) {
            capturer.startCapturing(fromFileNamed: "video.mp4") { error in
                sdkLogger.error("Error while capturing from file: \(error.localizedDescription)")
            }

        } else {
            fatalError("Fatal when capturing video from file")
        }
    }

    public func stopCapture() {
        capturer.stopCapture()
    }
}
