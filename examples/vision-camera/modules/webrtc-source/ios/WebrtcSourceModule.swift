import RNFishjamClient
import ExpoModulesCore
import VisionCamera

public class WebrtcSourceModule: Module {
  

  public func definition() -> ModuleDefinition {
    Name("WebrtcSource")
    
    OnCreate {
      FrameProcessorPluginRegistry.addFrameProcessorPlugin("sendFrame") { proxy, options in
        return WebrtcFrameProcessorPlugin(proxy: proxy, options: options)
      }
    }
    
    AsyncFunction("createVisionCameraTrack") {
      if let exisitingSource = WebrtcFrameProcessorPlugin.currentSource {
        RNFishjamProxy.remove(customSource: exisitingSource)
      }
      
      let source = WebrtcVisionCameraCustomSource()
      
      WebrtcFrameProcessorPlugin.currentSource = source
      
      try await RNFishjamProxy.add(customSource: source)
    }
    
    AsyncFunction("removeVisionCameraTrack") {
      if let exisitingSource = WebrtcFrameProcessorPlugin.currentSource {
        RNFishjamProxy.remove(customSource: exisitingSource)
      }
      WebrtcFrameProcessorPlugin.currentSource = nil
    }
  }
}
