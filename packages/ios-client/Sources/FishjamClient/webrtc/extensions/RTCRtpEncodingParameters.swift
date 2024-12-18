import WebRTC

extension RTCRtpEncodingParameters {
    func withBitrate(kbps: Int?) -> RTCRtpEncodingParameters {
        let copy = RTCRtpEncodingParameters()
        copy.rid = self.rid
        copy.isActive = self.isActive
        copy.scaleResolutionDownBy = self.scaleResolutionDownBy
        copy.maxBitrateBps = kbps == 0 ? nil : (kbps.map { $0 * 1024 } as NSNumber?)
        return copy
    }
    
    var scaleResolutionDownByDouble: Double {
        Double(truncating: scaleResolutionDownBy ?? 1)
    }
}

extension Array where Element == RTCRtpEncodingParameters {
    func withUpdatedBitrates(_ calculator: (Array<RTCRtpEncodingParameters>) -> [(Int, Int?)]) -> [RTCRtpEncodingParameters] {
        let bitrateUpdates = calculator(self)
        return enumerated().map { index, encoding in
            let (_, bitrate) = bitrateUpdates[index]
            return encoding.withBitrate(kbps: bitrate)
        }
    }
}
