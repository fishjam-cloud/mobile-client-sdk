import RNFishjamClient
import ExpoModulesCore
import VisionCamera

public class WebrtcSourceModule: Module {
  static let registerPlugin: Void = {
    FrameProcessorPluginRegistry.addFrameProcessorPlugin("sendFrame") { proxy, options in
      return WebrtcFrameProcessorPlugin(proxy: proxy, options: options)
    }
  }()
  
  public required init(appContext: AppContext) {
    super.init(appContext: appContext)
    _ = WebrtcSourceModule.registerPlugin
  }
  
  public func definition() -> ModuleDefinition {
    Name("WebrtcSource")
    
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
