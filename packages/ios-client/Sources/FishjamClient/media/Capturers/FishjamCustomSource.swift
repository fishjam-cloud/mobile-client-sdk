import UIKit
import WebRTC

public enum VideoRotation: Int {
    case zero = 0
    case ninety = 90
    case oneEighty = 180
    case twoSeventy = 270

    public var rtcValue: RTCVideoRotation {
        return .init(rawValue: self.rawValue)!
    }
}

public protocol CustomSourceDelegate: AnyObject {
    func customSource(
        _ customSource: CustomSource,
        didOutputSampleBuffer sampleBuffer: CMSampleBuffer,
        rotation: VideoRotation
    )
}

public protocol CustomSource: AnyObject {
    var delegate: CustomSourceDelegate? { get set }
    var isScreenShare: Bool { get }
    var metadata: Metadata { get }
    var videoParameters: VideoParameters { get }
}

class CustomSourceRTCVideoCapturerAdapter: RTCVideoCapturer, CustomSourceDelegate {
    let trackId: String
    let rtcVideoSource: RTCVideoSource
    let customSource: CustomSource

    init(
        trackId: String,
        customSource: CustomSource,
        rtcVideoSource: RTCVideoSource
    ) {
        self.trackId = trackId
        self.rtcVideoSource = rtcVideoSource
        self.customSource = customSource
        super.init()

        self.customSource.delegate = self
    }

    func customSource(
        _ customSource: CustomSource,
        didOutputSampleBuffer sampleBuffer: CMSampleBuffer,
        rotation: VideoRotation
    ) {
        guard sampleBuffer.isValid else { return }

        guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else {
            return
        }

        let height = Int32(CVPixelBufferGetHeight(pixelBuffer))
        let width = Int32(CVPixelBufferGetWidth(pixelBuffer))

        let rtcBuffer = RTCCVPixelBuffer(
            pixelBuffer: pixelBuffer,
            adaptedWidth: width,
            adaptedHeight: height,
            cropWidth: width,
            cropHeight: height,
            cropX: 0,
            cropY: 0
        )

        let buffer = rtcBuffer.toI420()
        let videoFrame = RTCVideoFrame(
            buffer: buffer,
            rotation: rotation.rtcValue,
            timeStampNs: sampleBuffer.presentationTimeStamp.value
        )

        let delegate = rtcVideoSource as RTCVideoCapturerDelegate

        delegate.capturer(self, didCapture: videoFrame)
    }
}
