
import Foundation
import WebRTC
import ScreenCaptureKit

//class MacScreenShareCapturer: RTCVideoCapturer {
//  public weak var capturerDelegate: BroadcastScreenShareReceiverDelegate?
//  
//  private let videoParameters: VideoParameters
//  let source: RTCVideoSource
//  private var started = false
//  private var isReceivingSamples: Bool = false
//  
//  private var timeoutTimer: Timer?
//  
//  internal let supportedPixelFormats = RTCCVPixelBuffer.supportedPixelFormats()
//  
//  /**
//   Creates a  broadcast screen capturer.
//   
//   - Parameters:
//   - source: `RTCVideoSource` that will receive incoming video buffers
//   - appGroup: App Group that will be used for starting an `IPCServer` on
//   - videoParameters: The parameters used for limiting the screen capture resolution and target framerate
//   - delegate: A delegate that will receive notifications about the sceeen capture events such as started/stopped or paused
//   */
//  init(
//    _ source: RTCVideoSource, videoParameters: VideoParameters,
//    delegate: BroadcastScreenShareReceiverDelegate? = nil
//  ) {
//    self.source = source
//    self.videoParameters = videoParameters
//    
//    capturerDelegate = delegate
//    
//    super.init(delegate: source)
//    
//    // check every 5 seconds if the screensharing is still active or crashed
//    // this is needed as we can't know if the IPC Client stopped working or not, so at least
//    // we can check that that we receiving some samples
//    timeoutTimer = Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { [weak self] timer in
//      //            guard let self else {
//      //                timer.invalidate()
//      //                return
//      //            }
//      //
//      //            // NOTE: there is basically no way of telling if the user has still
//      //            // an opened RPSystemBroadcastPickerView, but we can assume that if the application
//      //            // is in inactive state then this is a case therefore ignore the timeoutTimer tick
//      //            if UIApplication.shared.applicationState == .inactive {
//      //                return
//      //            }
//      //
//      //            if !self.isReceivingSamples {
//      //                self.capturerDelegate?.stopped()
//      //                timer.invalidate()
//      //                return
//      //            }
//      //
//      //            self.isReceivingSamples = false
//    }
//    
//    
//  }
//  
//  public func startListening() {
//    //        guard ipcServer.listen(for: appGroup) else {
//    //            fatalError(
//    //                "Failed to open IPC for screen broadcast, make sure that both app and extension are using same App Group"
//    //            )
//    //        }
//  }
//  
//  public func stopListening() {
//    //        ipcServer.close()
//    //        ipcServer.dispose()
//  }
//}

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



//@available(macCatalyst 18.2, *)
//class StreamOutput: NSObject, SCStreamOutput {
//  var sessionStarted = false
//  var firstSampleTime: CMTime = .zero
//  var lastSampleBuffer: CMSampleBuffer?
//  let source: RTCVideoSource
//  
//  
//  init(source: RTCVideoSource) {
//    self.source = source
//    super.init()
//  }
//  
//  func stream(_ stream: SCStream, didOutputSampleBuffer sampleBuffer: CMSampleBuffer, of type: SCStreamOutputType) {
//    
//    // Return early if session hasn't started yet
//    guard sessionStarted else { return }
//    
//    // Return early if the sample buffer is invalid
//    guard sampleBuffer.isValid else { return }
//    
//    // Retrieve the array of metadata attachments from the sample buffer
//    guard let attachmentsArray = CMSampleBufferGetSampleAttachmentsArray(sampleBuffer, createIfNecessary: false) as? [[SCStreamFrameInfo: Any]],
//          let attachments = attachmentsArray.first
//    else { return }
//    
//    // Validate the status of the frame. If it isn't `.complete`, return
//    guard let statusRawValue = attachments[SCStreamFrameInfo.status] as? Int,
//          let status = SCFrameStatus(rawValue: statusRawValue),
//          status == .complete
//    else { return }
//    
//    
//    switch type {
//    case .screen:
//    
//      guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else {
//        return
//      }
//      
//      let height = Int32(CVPixelBufferGetHeight(pixelBuffer))
//      let width = Int32(CVPixelBufferGetWidth(pixelBuffer))
//
//      let rtcBuffer = RTCCVPixelBuffer(
//          pixelBuffer: pixelBuffer,
//          adaptedWidth: width,
//          adaptedHeight: height,
//          cropWidth: width,
//          cropHeight: height,
//          cropX: 0,
//          cropY: 0)
//
//      var rotation: RTCVideoRotation = ._0
//      
//      let buffer = rtcBuffer.toI420()
//      let videoFrame = RTCVideoFrame(
//        buffer: buffer, rotation: rotation, timeStampNs: sampleBuffer.presentationTimeStamp.value)
//
//      let delegate = source as RTCVideoCapturerDelegate
//
//      delegate.capturer(self, didCapture: videoFrame)
//    case .audio:
//      break
//      
//    @unknown default:
//      break
//    }
//  }
//}

