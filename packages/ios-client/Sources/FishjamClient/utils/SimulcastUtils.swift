import WebRTC

extension RTCRtpEncodingParameters {
    static func create(rid: String, active: Bool, scaleResolutionDownBy: NSNumber)
        -> RTCRtpEncodingParameters
    {
        let encoding = RTCRtpEncodingParameters()
        encoding.rid = rid
        encoding.isActive = active
        encoding.scaleResolutionDownBy = scaleResolutionDownBy
        return encoding
    }

    static func create(active: Bool) -> RTCRtpEncodingParameters {
        let encoding = RTCRtpEncodingParameters()
        encoding.isActive = active
        return encoding
    }
}
