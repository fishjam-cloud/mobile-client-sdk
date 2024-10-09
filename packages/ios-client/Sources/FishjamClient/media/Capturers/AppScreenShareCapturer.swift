import Foundation
import ReplayKit
import WebRTC

/// Responsible for capturing only user app
class AppScreenShareCapturer: RTCVideoCapturer, VideoCapturer {
    let screenRecorder: RPScreenRecorder
    let source: RTCVideoSource

    init(_ source: RTCVideoSource) {
        screenRecorder = RPScreenRecorder.shared()
        self.source = source

        super.init()

        guard screenRecorder.isAvailable else {
            sdkLogger.error("Screen recording is not available")
            return
        }
    }

    private func handleSourceBuffer(buffer: CMSampleBuffer, type _: RPSampleBufferType) {
        if CMSampleBufferGetNumSamples(buffer) != 1 || !CMSampleBufferIsValid(buffer)
            || !CMSampleBufferDataIsReady(buffer)
        {
            return
        }

        guard let pixelBuffer: CVPixelBuffer = CMSampleBufferGetImageBuffer(buffer) else {
            return
        }

        let width = CVPixelBufferGetWidth(pixelBuffer)
        let height = CVPixelBufferGetHeight(pixelBuffer)

        source.adaptOutputFormat(toWidth: Int32(width / 3), height: Int32(height / 3), fps: 8)

        let rtcPixelBuffer = RTCCVPixelBuffer(pixelBuffer: pixelBuffer)

        let timeStampNs =
            Int64(CMTimeGetSeconds(CMSampleBufferGetPresentationTimeStamp(buffer))) * Int64(NSEC_PER_SEC)

        let videoFrame = RTCVideoFrame(
            buffer: rtcPixelBuffer, rotation: RTCVideoRotation._0, timeStampNs: timeStampNs)

        let delegate = source as RTCVideoCapturerDelegate

        delegate.capturer(self, didCapture: videoFrame)
    }

    func startCapture() {
        screenRecorder.startCapture(
            handler: { sampleBuffer, bufferType, _ in
                if bufferType == RPSampleBufferType.video {
                    self.handleSourceBuffer(buffer: sampleBuffer, type: bufferType)
                }
            },
            completionHandler: { error in
                sdkLogger.error("Encountered error while capturing screen: \(error?.localizedDescription ?? "")")
            })
    }

    func stopCapture() {
        if screenRecorder.isRecording {
            screenRecorder.stopCapture()
        }
    }
}
