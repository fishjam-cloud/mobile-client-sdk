import Foundation
import WebRTC

public protocol CustomSourceDelegate: AnyObject {
    func fishjamCustomSource(customSource: CustomSource, didOutputSampleBuffer sampleBuffer: CMSampleBuffer)
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
        trackId: String, customSource: CustomSource, rtcVideoSource: RTCVideoSource) {
        self.trackId = trackId
        self.rtcVideoSource = rtcVideoSource
        self.customSource = customSource
        super.init()

        self.customSource.delegate = self
    }

    func fishjamCustomSource(customSource: CustomSource, didOutputSampleBuffer sampleBuffer: CMSampleBuffer) {
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
            cropY: 0)

        let rotation = RTCVideoRotation._0

        let buffer = rtcBuffer.toI420()
        let videoFrame = RTCVideoFrame(
            buffer: buffer, rotation: rotation, timeStampNs: sampleBuffer.presentationTimeStamp.value)

        let delegate = rtcVideoSource as RTCVideoCapturerDelegate

        delegate.capturer(self, didCapture: videoFrame)
    }
}
