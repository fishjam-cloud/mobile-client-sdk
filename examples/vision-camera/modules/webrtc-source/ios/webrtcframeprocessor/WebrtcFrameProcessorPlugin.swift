import FishjamCloudClient
import VisionCamera

class WebrtcVisionCameraCustomSource: CustomSource {
  var delegate: CustomSourceDelegate?
  
  let isScreenShare = false
  let metadata = ["type":"camera"].toMetadata()
  let videoParameters = VideoParameters.presetFHD43
}

public class WebrtcFrameProcessorPlugin: FrameProcessorPlugin {
  static var currentSource: WebrtcVisionCameraCustomSource?

  public override func callback(_ frame: Frame, withArguments arguments: [AnyHashable : Any]?) -> Any {
    if let customSource = WebrtcFrameProcessorPlugin.currentSource {
      WebrtcFrameProcessorPlugin.currentSource?.delegate?.customSource(customSource, didOutputSampleBuffer: frame.buffer)
    }
    
    return frame
  }
}
