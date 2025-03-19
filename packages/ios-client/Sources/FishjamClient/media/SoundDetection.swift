import AVFoundation

enum SoundDetectionError: Error {
    case audioEngineStartFailed
    case audioConverterInitializationFailed
    case audioDataConversionFailed
}
// Class for sound detection using the device's microphone
public class SoundDetection: ObservableObject {

    // Audio engine for sound detection
    private var engine: AVAudioEngine?
    private var inputNode: AVAudioInputNode?
    private var mixerNode: AVAudioMixerNode?
    public typealias VolumeChangedListener = (Int) -> Void
    public typealias SoundDetectedListener = (Bool) -> Void
    private var onSoundDetectedListener: SoundDetectedListener?
    private var onVolumeChangedListener: VolumeChangedListener?

    // Property to indicate the recording state
    public var isRecording: Bool = false

    public init() throws {
        try setupSession()
        setupEngine()
    }

    /**
     Sets a listener to receive sound volume change events.

     - Parameter listener: The listener to be notified when sound volume changes.
     */
    public func setOnVolumeChangedListener(listener: VolumeChangedListener?) {
        onVolumeChangedListener = listener
    }

    /**
     Sets a listener to receive sound detection events.

     - Parameter listener: The listener to be notified when a sound is detected.
     */
    public func setOnSoundDetectedListener(listener: SoundDetectedListener?) {
        onSoundDetectedListener = listener
    }

    /// Method to set up the Audio Session.
    private func setupSession() throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.record)
        try session.setActive(true, options: .notifyOthersOnDeactivation)
    }

    /// Method to set up the Audio Engine.
    private func setupEngine() {
        engine = AVAudioEngine()
        mixerNode = AVAudioMixerNode()
        if let engine = engine,
            let mixerNode = mixerNode
        {
            mixerNode.volume = 0
            engine.attach(mixerNode)
            makeConnections()
            engine.prepare()

        }
    }

    /// Method to patch AVAudioNodes together.
    private func makeConnections() {
        if let engine = engine,
            let mixerNode = mixerNode
        {
            let inputNode = engine.inputNode
            let inputFormat = inputNode.outputFormat(forBus: 0)
            engine.connect(inputNode, to: mixerNode, format: inputFormat)
            let mainMixerNode = engine.mainMixerNode
            let mixerFormat = AVAudioFormat(
                commonFormat: .pcmFormatFloat32,
                sampleRate: inputFormat.sampleRate,
                channels: 1,
                interleaved: false
            )
            engine.connect(mixerNode, to: mainMixerNode, format: mixerFormat)
        }
    }

    /**
     Starts the sound detection process with the specified volume threshold.

     - Parameter volumeThreshold: The threshold value in decibels (dB) above which a sound is considered detected.
     */
    public func start(_ volumeThreshold: Int = 60) throws {
        if let engine = engine,
            let mixerNode = mixerNode
        {
            let tapNode: AVAudioNode = mixerNode
            let format = tapNode.outputFormat(forBus: 0)

            tapNode.installTap(
                onBus: 0,
                bufferSize: 4096,
                format: format,
                block: {
                    (buffer, time) in
                    do {
                        try self.processAudioBufferForSoundDetection(from: buffer, volumeThreshold)
                    } catch let error {
                        print("Error processing audio buffer: \(error)")
                    }
                }
            )

            do {
                try engine.start()
                isRecording = true
            } catch {
                throw SoundDetectionError.audioEngineStartFailed
            }
        }
    }

    /**
     Processes the provided AVAudioPCMBuffer for sound detection.

     - Parameters:
     - buffer: The audio buffer.
     - volumeThreshold: The threshold value in decibels (dB) above which a sound is considered detected.
     */
    private func processAudioBufferForSoundDetection(
        from buffer: AVAudioPCMBuffer,
        _ volumeThreshold: Int = 60
    ) throws {
        let amplitude = try getMaxAmplitude(from: buffer)
        let soundVolume = calculateValue(from: amplitude)
        onVolumeChangedListener?(soundVolume)
        onSoundDetectedListener?(soundVolume > volumeThreshold)
    }

    /// Stops the sound detection process.
    public func stop() {
        if let engine = engine,
            let mixerNode = mixerNode
        {
            mixerNode.removeTap(onBus: 0)
            engine.stop()
            isRecording = false
        }
    }

    /** Method to calculate the maximum amplitude in the buffer.

     - Parameter buffer: The audio buffer.
     - Returns: The maximum amplitude value from the buffer.
     */
    private func getMaxAmplitude(from buffer: AVAudioPCMBuffer) throws -> Int {
        let convertedBuffer = try convertFloat32To16(buffer: buffer)
        guard let data = convertedBuffer?.int16ChannelData else {
            throw SoundDetectionError.audioDataConversionFailed
        }
        let frameLength = Int(buffer.frameLength)
        var maxAmplitude: Int16 = 0
        maxAmplitude = (0..<frameLength).reduce(0) { max($0, data[0][$1]) }
        return Int(maxAmplitude)
    }

    /**
     Converts PCM Buffer from Float32 to Int16

     - Parameter buffer: The audio buffer in Float32.
     - Returns: The converted audio buffer in Int16 format
     */
    private func convertFloat32To16(buffer: AVAudioPCMBuffer) throws -> AVAudioPCMBuffer? {
        let sourceFormat = buffer.format
        guard
            let targetFormat = AVAudioFormat(
                commonFormat: .pcmFormatInt16,
                sampleRate: sourceFormat.sampleRate,
                channels: sourceFormat.channelCount,
                interleaved: true
            )
        else {
            throw SoundDetectionError.audioConverterInitializationFailed
        }

        guard let converter = AVAudioConverter(from: sourceFormat, to: targetFormat) else {
            throw SoundDetectionError.audioConverterInitializationFailed
        }

        let outputBuffer = AVAudioPCMBuffer(
            pcmFormat: targetFormat,
            frameCapacity: buffer.frameCapacity
        )
        let inputBlock: AVAudioConverterInputBlock = { inNumPackets, outStatus in
            outStatus.pointee = .haveData
            return buffer
        }

        var error: NSError? = nil
        let result = converter.convert(to: outputBuffer!, error: &error, withInputFrom: inputBlock)

        if result == .error || error != nil {
            throw SoundDetectionError.audioDataConversionFailed
        }

        return outputBuffer
    }

    /** Method to calculate decibel (dB) value from maximum amplitude.

     Sound pressure level (SPL) or volume is often expressed in decibels. This method transforms the amplitude
     of the audio signal into a decibel value using the formula `20 * log10(amplitude)`. [https://en.wikipedia.org/wiki/Sound_pressure#Sound_pressure_level]

     As the logarithm of a number less than one is negative and we're dealing with sound 'pressure',
     we take the logarithm of the positive maximum amplitude. `-160 dB` is used as a minimum threshold because
     it's generally accepted as a "below the threshold of hearing" in humans.

     - Parameter maxAmplitude: The calculated maximum amplitude from the audio buffer.
     - Returns: The calculated sound level value in decibels (dB).
     */
    private func calculateValue(from maxAmplitude: Int) -> Int {
        if maxAmplitude <= 0 { return -160 }
        return Int(20 * log10(Double(maxAmplitude) / 1.0))
    }

}
