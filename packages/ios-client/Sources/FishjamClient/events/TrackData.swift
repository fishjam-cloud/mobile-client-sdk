public struct TrackData: Codable {
    public let metadata: Metadata
    public let simulcastConfig: SimulcastConfig?

    public init(metadata: Metadata, simulcastConfig: SimulcastConfig? = nil) {
        self.metadata = metadata
        self.simulcastConfig = simulcastConfig
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.metadata = try container.decodeIfPresent(Metadata.self, forKey: .metadata) ?? Metadata()
        self.simulcastConfig = try container.decodeIfPresent(SimulcastConfig.self, forKey: .simulcastConfig)
    }

    func copyWith(metadata: Metadata? = nil, simulcastConfig: SimulcastConfig? = nil) -> TrackData {
        return TrackData(
            metadata: metadata ?? self.metadata,
            simulcastConfig: simulcastConfig ?? self.simulcastConfig
        )
    }
}
