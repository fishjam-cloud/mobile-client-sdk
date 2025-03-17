
import Foundation
import WebRTC

public protocol FishjamCustomSourceDelegate: AnyObject {
  func fishjamCustomSource(customSource: FishjamCustomSource, didOutputSampleBuffer sampleBuffer: CMSampleBuffer)
  func fishjamCustomSourceDidStop(_ customSource: FishjamCustomSource)
}

public protocol FishjamCustomSource: AnyObject {
  var delegate: FishjamCustomSourceDelegate? { get set }
}

class FishjamCustomSourceRTCAdapter: RTCVideoCapturer, FishjamCustomSourceDelegate {
  let trackId: String
  let rtcVideoSource: RTCVideoSource
  let customSource: FishjamCustomSource
  let onStop: () -> Void
  
  init(trackId: String, customSource: FishjamCustomSource, rtcVideoSource: RTCVideoSource, onStop: @escaping () -> Void) {
    self.trackId = trackId
    self.rtcVideoSource = rtcVideoSource
    self.customSource = customSource
    self.onStop = onStop
    super.init()
    
    self.customSource.delegate = self
  }
  
  func fishjamCustomSource(customSource: FishjamCustomSource, didOutputSampleBuffer sampleBuffer: CMSampleBuffer) {
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
  
  func fishjamCustomSourceDidStop(_ customSource: any FishjamCustomSource) {
    onStop()
  }
}
