public enum EndpointType: String, Codable {
    case WEBRTC

    init(fromString s: String) {
        switch s.lowercased() {
        case "webrtc":
            self = .WEBRTC
        default:
            self = .WEBRTC
        }
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        let rawValue = try container.decode(String.self)
        self.init(fromString: rawValue)
    }

    public func encode(to encoder: Swift.Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(self.rawValue)
    }
}

public struct Endpoint {

    public let id: String
    public let type: EndpointType
    public let metadata: Metadata
    public var tracks: [String: Track]

    public init(id: String, type: EndpointType, metadata: Metadata = Metadata(), tracks: [String: Track] = [:]) {
        self.id = id
        self.type = type
        self.metadata = metadata
        self.tracks = tracks
    }

    public func copyWith(
        id: String? = nil, type: EndpointType? = nil, metadata: Metadata? = nil, tracks: [String: Track]? = nil
    ) -> Self {
        return Endpoint(
            id: id ?? self.id,
            type: type ?? self.type,
            metadata: metadata ?? self.metadata,
            tracks: tracks ?? self.tracks
        )
    }

    internal func addOrReplaceTrack(_ track: Track) -> Endpoint {
        var newTracks = tracks
        newTracks.updateValue(track, forKey: track.id)
        return copyWith(tracks: newTracks)
    }

    internal func removeTrack(_ track: Track) -> Endpoint {
        var newTracks = tracks
        newTracks.removeValue(forKey: track.id)
        return copyWith(tracks: newTracks)
    }
}
