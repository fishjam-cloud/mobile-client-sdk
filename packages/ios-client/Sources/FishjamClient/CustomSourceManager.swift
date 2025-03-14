import WebRTC

class CustomSourceManager {
  private var sources: [FishjamCustomSourceRTCAdapter] = []
  
  func addSource(_ source: FishjamCustomSource, videoSource: RTCVideoSource) {
    sources.append(FishjamCustomSourceRTCAdapter(customSource: source, rtcVideoSource: videoSource, onStop: {}))
  }
  
  func removeSource(_ source: FishjamCustomSource) {
    if let index = sources.firstIndex(where: { $0.customSource === source }) {
      sources.remove(at: index)
    }
  }
}
