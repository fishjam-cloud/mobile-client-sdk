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
        id: String? = nil, metadata: Metadata? = nil, tracks: [String: Track]? = nil
    ) -> Self {
        return Endpoint(
            id: id ?? self.id,
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
  
    var hasVideoTracks: Bool {
      tracks.values.contains(where: { $0 is VideoTrack })
    }
}
