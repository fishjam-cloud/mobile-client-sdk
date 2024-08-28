import WebRTC

internal class AudioUtils {
    static let constraints: [String: String] = [
        "googEchoCancellation": "true",
        "googAutoGainControl": "true",
        "googNoiseSuppression": "true",
        "googTypingNoiseDetection": "true",
        "googHighpassFilter": "true",
    ]

    static let audioConstraints = RTCMediaConstraints(
        mandatoryConstraints: nil, optionalConstraints: constraints)

    static func createAudioConfig() -> RTCAudioSessionConfiguration {
        let config = RTCAudioSessionConfiguration.webRTC()
        config.category = AVAudioSession.Category.playAndRecord.rawValue
        config.mode = AVAudioSession.Mode.videoChat.rawValue
        config.categoryOptions = [.duckOthers, .allowAirPlay, .allowBluetooth, .allowBluetoothA2DP]

        return config
    }
}
