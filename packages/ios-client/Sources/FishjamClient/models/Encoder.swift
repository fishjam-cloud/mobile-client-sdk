import WebRTC

/// Enum describing possible encoders.
/// `DEFAULT` - default encoder, most likely software vp8 encoder (libvpx)
/// `H264` - hardware H264 encoder
public enum Encoder {
    case DEFAULT
    case H264
}

func getEncoderFactory(from: Encoder) -> RTCVideoEncoderFactory {
    switch from {
    case .DEFAULT:
        return RTCDefaultVideoEncoderFactory()
    case .H264:
        return RTCVideoEncoderFactoryH264()
    }
}
