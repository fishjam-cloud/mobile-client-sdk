import WebRTC

struct Constants {
    static func simulcastEncodings() -> [TrackEncoding: RTCRtpEncodingParameters] {
        return [
            TrackEncoding.l: RTCRtpEncodingParameters.create(rid: "l", active: false, scaleResolutionDownBy: 4.0),
            TrackEncoding.m: RTCRtpEncodingParameters.create(rid: "m", active: false, scaleResolutionDownBy: 2.0),
            TrackEncoding.h: RTCRtpEncodingParameters.create(rid: "h", active: false, scaleResolutionDownBy: 1.0),
        ]
    }
}
