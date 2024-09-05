import WebRTC

struct Constants {
    static func simulcastEncodings() -> [RTCRtpEncodingParameters] {
        return [
            RTCRtpEncodingParameters.create(rid: "l", active: false, scaleResolutionDownBy: 4.0),
            RTCRtpEncodingParameters.create(rid: "m", active: false, scaleResolutionDownBy: 2.0),
            RTCRtpEncodingParameters.create(rid: "h", active: false, scaleResolutionDownBy: 1.0),
        ]
    }
}
