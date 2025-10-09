/// Type describing bandwidth limit for simulcast track.
/// It is a mapping (encoding => BandwidthLimit).
/// If encoding isn't present in this mapping, it will be assumed that this particular encoding shouldn't have any bandwidth limit
public typealias SimulcastBandwidthLimit = [String: Int]

/// Type describing maximal bandwidth that can be used, in kbps. 0 is interpreted as unlimited bandwidth.
public typealias BandwidthLimit = Int

/// Type describing bandwidth limitation of a Track, including simulcast and non-simulcast tracks.
/// An enum of `BandwidthLimit` and `SimulcastBandwidthLimit`
public enum TrackBandwidthLimit {
    case BandwidthLimit(BandwidthLimit)
    case SimulcastBandwidthLimit(SimulcastBandwidthLimit)
}

extension TrackBandwidthLimit: Codable {
    enum CodingKeys: String, CodingKey {
        case type
        case value
    }
    
    public init(from decoder: Swift.Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)
        
        switch type {
        case "BandwidthLimit":
            let value = try container.decode(Int.self, forKey: .value)
            self = .BandwidthLimit(value)
        case "SimulcastBandwidthLimit":
            let value = try container.decode([String: Int].self, forKey: .value)
            self = .SimulcastBandwidthLimit(value)
        default:
            throw DecodingError.dataCorruptedError(
                forKey: .type,
                in: container,
                debugDescription: "Unknown TrackBandwidthLimit type: \(type)"
            )
        }
    }
    
    public func encode(to encoder: Swift.Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        
        switch self {
        case .BandwidthLimit(let value):
            try container.encode("BandwidthLimit", forKey: .type)
            try container.encode(value, forKey: .value)
        case .SimulcastBandwidthLimit(let value):
            try container.encode("SimulcastBandwidthLimit", forKey: .type)
            try container.encode(value, forKey: .value)
        }
    }
}
