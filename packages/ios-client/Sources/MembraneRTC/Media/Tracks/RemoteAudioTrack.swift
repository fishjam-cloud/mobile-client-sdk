import WebRTC

public protocol VadChangedListener {
    func onVadChanged(track: RemoteAudioTrack)
}

/// Utility wrapper around a remote `RTCAudioTrack`.
public class RemoteAudioTrack: Track {
    private var vadChangedListener: VadChangedListener? = nil

    init(
        audioTrack: RTCAudioTrack, endpointId: String, rtcEngineId: String? = nil, metadata: Metadata = Metadata(),
        id: String = UUID().uuidString
    ) {
        super.init(mediaTrack: audioTrack, endpointId: endpointId, rtcEngineId: rtcEngineId, metadata: metadata)
    }

    private var _vadStatus: VadStatus = VadStatus.silence

    var vadStatus: VadStatus {
        get { return _vadStatus }
        set {
            vadChangedListener?.onVadChanged(track: self)
        }
    }

    func setVadChangedListener(listener: VadChangedListener) {
        listener.onVadChanged(track: self)
        vadChangedListener = listener
    }

    internal var audioTrack: RTCAudioTrack {
        return self.mediaTrack as! RTCAudioTrack
    }

    /// Sets a volume for given remote track, should be in range [0, 1]
    public func setVolume(_ volume: Double) {
        guard volume >= 0.0, volume <= 1.0 else { return }

        // from WebRTC internal documentation this volume is in range 0-10 so just multiply it
        (mediaTrack as? RTCAudioTrack)?.source.volume = volume * 10.0
    }
}
