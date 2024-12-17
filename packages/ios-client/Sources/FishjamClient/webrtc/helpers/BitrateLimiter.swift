import WebRTC

struct BitrateLimiter {
    static func calculateBitrates(for encodings: [RTCRtpEncodingParameters], maxBitrate: TrackBandwidthLimit) -> [RTCRtpEncodingParameters] {
        switch maxBitrate {
        case .BandwidthLimit(let limit):
            return calculateUniformBitrates(for: encodings, bitrate: limit)
        case .SimulcastBandwidthLimit(let limits):
            return calculateSimulcastBitrates(for: encodings, limits: limits)
        }
    }
    
    private static func calculateSimulcastBitrates(
        for encodings: [RTCRtpEncodingParameters],
        limits: [String: Int]
    ) -> [RTCRtpEncodingParameters] {
        return encodings.map { encoding in
            let encodingLimit = limits[encoding.rid ?? ""] ?? 0
            return encoding.withBitrate(kbps: encodingLimit)
        }
    }
    
    private static func calculateUniformBitrates(
        for encodings: [RTCRtpEncodingParameters],
        bitrate: Int
    ) -> [RTCRtpEncodingParameters] {
        guard !encodings.isEmpty else { return [] }
        guard bitrate != 0 else {
            return encodings.map { $0.withBitrate(kbps: nil) }
        }
        
        // Find minimum scale resolution
        let k0 = encodings.map { $0.scaleResolutionDownByDouble }
                         .min() ?? 1.0
                         
        let bitrateParts = encodings.reduce(0.0) { acc, encoding in
            acc + pow((k0 / encoding.scaleResolutionDownByDouble), 2)
        }
        
        let multiplier = Double(bitrate) / bitrateParts
        
        // Calculate new bitrates
        return encodings.map { encoding in
            let calculatedBitrate = Int(
                multiplier * pow(k0 / encoding.scaleResolutionDownByDouble, 2)
            )
            return encoding.withBitrate(kbps: calculatedBitrate)
        }
    }
}
