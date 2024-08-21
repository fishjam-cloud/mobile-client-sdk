//DONE ?
import WebRTC

/// Utility wrapper around a remote `RTCVideoTrack`.
public class RemoteVideoTrack: VideoTrack {
    private(set) public var encoding: TrackEncoding? = nil
    private(set) public var encodingReason: EncodingReason? = nil
    private var onTrackEncodingChangedListener: ((_ track: Track) throws -> Void)?

    override init(
        mediaTrack: RTCVideoTrack, endpointId: String, rtcEngineId: String?, metadata: Metadata = Metadata(),
        id: String = UUID().uuidString
    ) {
        super.init(mediaTrack: mediaTrack, endpointId: endpointId, rtcEngineId: rtcEngineId, metadata: metadata, id: id)
    }

    internal func setEncoding(encoding: TrackEncoding, encodingReason: EncodingReason) {
        self.encoding = encoding
        self.encodingReason = encodingReason
        do{
            try onTrackEncodingChangedListener?(self)
        }catch let error{
            sdkLogger.error("Encoding changed listener throwed error: \(error.localizedDescription)")
        }
    }
    
    public func setOnEncodingChangedListener(listener: ((_ track: Track) throws -> Void)?) {
        onTrackEncodingChangedListener = listener
        do{
            try onTrackEncodingChangedListener?(self)
        }catch let error{
            sdkLogger.error("Encoding changed listener throwed error: \(error.localizedDescription)")
        }
    }
}
