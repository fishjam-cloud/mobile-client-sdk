/// Enum describing possible track encodings.
/// `"h"` - original encoding
/// `"m"` - original encoding scaled down by 2
/// `"l"` - original encoding scaled down by 4
public enum TrackEncoding: Int, CustomStringConvertible, Codable, CaseIterable {
    case l = 1
    case m = 2
    case h = 3

    static private let descriptionMap: [Self: String] = [.l: "l", .m: "m", .h: "h"]

    public var description: String {
        return TrackEncoding.descriptionMap[self] ?? ""
    }

    enum TrackEncodingCodingError: Error {
        case decoding(String)
    }

    public init(_ s: String) throws {
        let lowercasedInput = s.lowercased()
        guard let value = TrackEncoding.allCases.first(where: { $0.description == lowercasedInput }) else {
            sdkLogger.error("TrackEncoding: \(s) is not a valid encoding")
            throw TrackEncodingCodingError.decoding("\(s) is not a valid encoding")
        }
        self = value
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        let encodingString = try container.decode(String.self)
        self = try TrackEncoding(encodingString)
    }

    public func encode(to encoder: Swift.Encoder) throws {
        var container = encoder.singleValueContainer()
        let encodingString = description
        try container.encode(encodingString)
    }
}

/// Simulcast configuration.
///
/// At the moment, simulcast track is initialized in three versions - low, medium and high.
/// High resolution is the original track resolution, while medium and low resolutions
/// are the original track resolution scaled down by 2 and 4 respectively.
public struct SimulcastConfig: Codable {
    /**
     * Whether to simulcast track or not.
     */
    public var enabled: Bool
    /**
     * List of initially active encodings.
     *
     * Encoding that is not present in this list might still be
     * enabled using {@link enableTrackEncoding}.
     */
    public var activeEncodings: [TrackEncoding] = []

    public init(enabled: Bool = false, activeEncodings: [TrackEncoding] = []) {
        self.enabled = enabled
        self.activeEncodings = activeEncodings
    }
}
