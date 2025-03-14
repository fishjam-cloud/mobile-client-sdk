import WebRTC

class CustomSourceManager {
  private var sources: [FishjamCustomSourceRTCAdapter] = []
  
  func addSource(trackId: String, source: FishjamCustomSource, videoSource: RTCVideoSource) {
    sources.append(FishjamCustomSourceRTCAdapter(trackId: trackId, customSource: source, rtcVideoSource: videoSource, onStop: {}))
  }
  
  func removeSource(_ source: FishjamCustomSource) -> String? {
    if let index = sources.firstIndex(where: { $0.customSource === source }) {
      let trackId = sources[index].trackId
      sources.remove(at: index)
      return trackId
    }
    return nil
  }
}
