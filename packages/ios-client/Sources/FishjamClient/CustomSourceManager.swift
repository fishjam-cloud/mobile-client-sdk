import WebRTC

class CustomSourceManager {
    private var sources: [CustomSourceRTCVideoCapturerAdapter] = []

    func add(source: CustomSource, withTrackId trackId: String, forRTCVideoSource videoSource: RTCVideoSource) {
        sources.append(
            CustomSourceRTCVideoCapturerAdapter(
                trackId: trackId, customSource: source, rtcVideoSource: videoSource)
        )
    }

    func remove(source: CustomSource) -> String? {
        if let index = sources.firstIndex(where: { $0.customSource === source }) {
            let trackId = sources[index].trackId
            sources.remove(at: index)
            return trackId
        }
        return nil
    }
}
