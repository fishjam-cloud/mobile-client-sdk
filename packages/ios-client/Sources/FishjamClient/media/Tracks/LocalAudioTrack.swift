import WebRTC

/// Utility wrapper around a local `RTCAudioTrack` managing a local audio session.
public class LocalAudioTrack: Track, LocalTrack {
    private let config: RTCAudioSessionConfiguration
    internal var audioSource: RTCAudioSource

    internal init(
        mediaTrack: RTCAudioTrack, audioSource: RTCAudioSource, endpointId: String, metadata: Metadata = Metadata()
    ) {
        config = AudioUtils.createAudioConfig()
        self.audioSource = audioSource
        super.init(mediaTrack: mediaTrack, endpointId: endpointId, rtcEngineId: nil, metadata: metadata)
    }

    internal init(mediaTrack: RTCAudioTrack, oldTrack: LocalAudioTrack) {
        self.config = oldTrack.config
        self.audioSource = oldTrack.audioSource
        super.init(mediaTrack: mediaTrack, endpointId: oldTrack.endpointId, rtcEngineId: oldTrack.rtcEngineId, metadata: oldTrack.metadata)
    }

    internal var audioTrack: RTCAudioTrack {
        return self.mediaTrack as! RTCAudioTrack
    }

    func start() {
        configure(setActive: true)
    }

    func stop() {
        configure(setActive: false)
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
