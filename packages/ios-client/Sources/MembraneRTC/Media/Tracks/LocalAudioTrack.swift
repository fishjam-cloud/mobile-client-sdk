import WebRTC

/// Utility wrapper around a local `RTCAudioTrack` managing a local audio session.
public class LocalAudioTrack: AudioTrack, LocalTrack {
    public let track: RTCAudioTrack
    private let config: RTCAudioSessionConfiguration
    private let audioSource: RTCAudioSource

    internal init(peerConnectionFactoryWrapper: PeerConnectionFactoryWrapper) {
        let constraints: [String: String] = [
            "googEchoCancellation": "true",
            "googAutoGainControl": "true",
            "googNoiseSuppression": "true",
            "googTypingNoiseDetection": "true",
            "googHighpassFilter": "true",
        ]

        let audioConstraints = RTCMediaConstraints(
            mandatoryConstraints: nil, optionalConstraints: constraints)

        config = RTCAudioSessionConfiguration.webRTC()
        config.category = AVAudioSession.Category.playAndRecord.rawValue
        config.mode = AVAudioSession.Mode.videoChat.rawValue
        config.categoryOptions = [.duckOthers, .allowAirPlay, .allowBluetooth, .allowBluetoothA2DP]

        audioSource = peerConnectionFactoryWrapper.createAudioSource(audioConstraints)

        let track = peerConnectionFactoryWrapper.createAudioTrack(source: audioSource)
        track.isEnabled = true

        self.track = track
    }

    internal init(oldTrack: LocalAudioTrack, peerConnectionFactoryWrapper: PeerConnectionFactoryWrapper) {
        self.config = oldTrack.config
        self.audioSource = oldTrack.audioSource
        let track = peerConnectionFactoryWrapper.createAudioTrack(source: audioSource)
        track.isEnabled = true

        self.track = track
    }

    public func start() {
        configure(setActive: true)
    }

    public func stop() {
        configure(setActive: false)
    }

    public func enabled() -> Bool {
        return track.isEnabled
    }

    public func setEnabled(_ enabled: Bool) {
        track.isEnabled = enabled
    }

    override func rtcTrack() -> RTCMediaStreamTrack {
        return track
    }

    public func trackId() -> String {
        return track.trackId
    }

    private func withAudioSession(callback: ((RTCAudioSession) throws -> Void)) {
        let audioSession = RTCAudioSession.sharedInstance()
        audioSession.lockForConfiguration()
        defer { audioSession.unlockForConfiguration() }

        do {
            try callback(audioSession)
        } catch {
            sdkLogger.error("Failed to set configuration for audio session")
        }
    }

    private func configure(setActive: Bool) {
        withAudioSession { audioSession in
            try audioSession.setConfiguration(config, active: setActive)
        }
    }

    private func setMode(mode: String) {
        withAudioSession { audioSession in
            config.mode = mode
            try audioSession.setConfiguration(config)
        }
    }

    /// Sets AVAudioSession configuration mode to voice chat
    /// (https://developer.apple.com/documentation/avfaudio/avaudiosession/mode/1616455-voicechat)
    public func setVoiceChatMode() {
        setMode(mode: AVAudioSession.Mode.voiceChat.rawValue)
    }

    /// Sets AVAudioSession configuration mode to video chat
    /// (https://developer.apple.com/documentation/avfaudio/avaudiosession/mode/1616590-videochat)
    public func setVideoChatMode() {
        setMode(mode: AVAudioSession.Mode.videoChat.rawValue)
    }
}
