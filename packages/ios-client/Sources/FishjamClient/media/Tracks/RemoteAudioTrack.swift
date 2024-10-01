import WebRTC

/// Utility wrapper around a remote `RTCAudioTrack`.
public class RemoteAudioTrack: Track {
    init(
        audioTrack: RTCAudioTrack, endpointId: String, rtcEngineId: String? = nil, metadata: Metadata = Metadata(),
        id: String = UUID().uuidString
    ) {
        super.init(mediaTrack: audioTrack, endpointId: endpointId, rtcEngineId: rtcEngineId, metadata: metadata, id: id)
    }
    
    private var vadChangedListener: ((_ track: Track) throws -> Void)?
    private var _vadStatus: VadStatus = VadStatus.silence

    internal(set) public var vadStatus: VadStatus {
        get { return _vadStatus }
        set {
            _vadStatus = newValue
            do {
                try vadChangedListener?(self)
            } catch let error {
                sdkLogger.error("VAD changed listener throwed error: \(error.localizedDescription)")
            }
        }
    }
    
    internal var audioTrack: RTCAudioTrack {
        return self.mediaTrack as! RTCAudioTrack
    }

    public func setVadChangedListener(listener: ((_ track: Track) throws -> Void)?) {
        vadChangedListener = listener
    }
}
