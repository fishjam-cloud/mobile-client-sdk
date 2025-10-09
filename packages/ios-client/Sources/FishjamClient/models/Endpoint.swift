import Foundation

public struct Endpoint {
    public let id: String
    public let metadata: Metadata
    public var tracks: [String: Track]

    public init(id: String, metadata: Metadata = Metadata(), tracks: [String: Track] = [:]) {
        self.id = id
        self.metadata = metadata
        self.tracks = tracks
    }

    public func copyWith(
        id: String? = nil,
        metadata: Metadata? = nil,
        tracks: [String: Track]? = nil
    ) -> Self {
        return Endpoint(
            id: id ?? self.id,
            metadata: metadata ?? self.metadata,
            tracks: tracks ?? self.tracks
        )
    }

    public func addOrReplaceTrack(_ track: Track) -> Endpoint {
        var newTracks = tracks
        newTracks.updateValue(track, forKey: track.id)
        return copyWith(tracks: newTracks)
    }

    internal func removeTrack(_ track: Track) -> Endpoint {
        var newTracks = tracks
        newTracks.removeValue(forKey: track.id)
        return copyWith(tracks: newTracks)
    }

    var hasVideoTracks: Bool {
        tracks.values.contains(where: { $0 is VideoTrack })
    }
}

// Custom Codable implementation that only encodes/decodes id and metadata
// Tracks are not serialized as they contain WebRTC objects that can't be encoded
extension Endpoint: Codable {
    enum CodingKeys: String, CodingKey {
        case id
        case metadata
    }
    
    public init(from decoder: Swift.Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try container.decode(String.self, forKey: .id)
        self.metadata = try container.decode(Metadata.self, forKey: .metadata)
        self.tracks = [:]
    }
    
    public func encode(to encoder: Swift.Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(metadata, forKey: .metadata)
        // Tracks are intentionally not encoded
    }
}
