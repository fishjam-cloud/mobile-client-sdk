import AVKit
import ExpoModulesCore
import FishjamCloudClient
import React
import ReplayKit
import WebRTC

class RNFishjamClient: FishjamClientListener {
    static var fishjamClient: FishjamClient? = nil

    var isCameraOn = false
    var isScreenShareOn = false
    var isAppScreenShareOn = false
    var isConnected = false

    private(set) var isCameraInitialized = false {
        didSet {
            emit(
                event: .currentCameraChanged(
                    localCamera: currentCamera, isCameraOn: isCameraOn, isCameraInitialized: isCameraInitialized))
        }
    }

    var connectPromise: Promise? = nil {
        didSet {
            guard connectPromise != nil else { return }

            let timeout = DispatchTime.now() + .seconds(15)
            DispatchQueue.main.asyncAfter(deadline: timeout) { [weak self] in
                // If promise is still assigned it means it was not resolved in that time,
                // so close the client and reject it with timeout error.
                guard let promise = self?.connectPromise else { return }
                RNFishjamClient.fishjamClient?.leave { [weak self] in
                    promise.reject("E_MEMBRANE_CONNECT", "Failed to connect: Fishjam server is not responding")
                    self?.connectPromise = nil
                    self?.peerStatus = .error
                }
            }
        }
    }

    var videoSimulcastConfig: SimulcastConfig = SimulcastConfig()

    var screenShareSimulcastConfig: SimulcastConfig = SimulcastConfig()

    var cameraId: String? = nil

    var audioSessionMode: AVAudioSession.Mode = .videoChat
    var errorMessage: String?

    var currentCamera: LocalCamera? { getLocalCameraTrack()?.currentCaptureDevice?.toLocalCamera() }

    private(set) var peerStatus: PeerStatus = .idle {
        didSet {
            emit(event: .peerStatusChanged(peerStatus: peerStatus))
        }
    }

    private(set) var reconnectionStatus: ReconnectionStatus = .idle {
        didSet {
            emit(event: .reconnectionStatusChanged(reconnectionStatus: reconnectionStatus))
        }
    }

    static private(set) var sendEvent: ((_ event: EmitableEvent) -> Void)?

    static var tracksUpdateListenersManager = TracksUpdateListenersManager()
    static var localCameraTracksChangedListenersManager = LocalCameraTracksChangedListenersManager()

    init(_ eventEmitter: @escaping (_ eventName: String, _ data: [String: Any?]) -> Void) {
        RNFishjamClient.sendEvent = { event in
            eventEmitter(event.event.name, event.data)
        }
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(onRouteChangeNotification),
            name: AVAudioSession.routeChangeNotification,
            object: nil
        )
    }

    deinit {
        RNFishjamClient.sendEvent = nil
    }

    private func getSimulcastConfigFromOptions(simulcastConfig: RNSimulcastConfig) throws -> SimulcastConfig {
        // iOS has a limit of 3 hardware encoders
        // 3 simulcast layers + 1 screen share layer = 4, which is too much
        // so we limit simulcast layers to 2
        let activeEncodings: [TrackEncoding] = [.l, .h]

        return SimulcastConfig(
            enabled: simulcastConfig.enabled,
            activeEncodings: activeEncodings
        )
    }

    func create() {
        RNFishjamClient.fishjamClient = FishjamClient(listener: self)
    }

    func getVideoParametersFromOptions(connectionOptions: CameraConfig) throws -> VideoParameters {
        let videoQuality = connectionOptions.quality
        let flipDimensions = connectionOptions.flipDimensions
        let simulcastConfig = try getSimulcastConfigFromOptions(simulcastConfig: connectionOptions.simulcastConfig)

        let preset: VideoParameters = {
            switch videoQuality {
            case "QVGA169":
                return VideoParameters.presetQVGA169
            case "VGA169":
                return VideoParameters.presetVGA169
            case "VQHD169":
                return VideoParameters.presetQHD169
            case "HD169":
                return VideoParameters.presetHD169
            case "FHD169":
                return VideoParameters.presetFHD169
            case "QVGA43":
                return VideoParameters.presetQVGA43
            case "VGA43":
                return VideoParameters.presetVGA43
            case "VQHD43":
                return VideoParameters.presetQHD43
            case "HD43":
                return VideoParameters.presetHD43
            case "FHD43":
                return VideoParameters.presetFHD43
            default:
                return VideoParameters.presetVGA169
            }
        }()
        let videoParameters = VideoParameters(
            dimensions: flipDimensions ? preset.dimensions.flipped : preset.dimensions,
            maxBandwidth: preset.maxBandwidth,
            simulcastConfig: simulcastConfig
        )
        return videoParameters
    }

    private var localEndpoint: Endpoint? {
        RNFishjamClient.fishjamClient?.getLocalEndpoint()
    }

    private func getLocalCameraTrack() -> LocalCameraTrack? {
        return localEndpoint?.tracks.compactMap { $0.value as? LocalCameraTrack }.first

    }

    private func getLocalAudioTrack() -> LocalAudioTrack? {
        return localEndpoint?.tracks.compactMap { $0.value as? LocalAudioTrack }.first

    }

    private func getLocalScreenBroadcastTrack() -> LocalBroadcastScreenShareTrack? {
        return localEndpoint?.tracks.compactMap { $0.value as? LocalBroadcastScreenShareTrack }.first

    }

    private func getLocalScreenAppTrack() -> LocalAppScreenShareTrack? {
        return localEndpoint?.tracks.compactMap { $0.value as? LocalAppScreenShareTrack }.first
    }

    private func ensureCreated() throws {
        if RNFishjamClient.fishjamClient == nil {
            throw Exception(
                name: "E_NOT_CREATED",
                description: "Client not created. Call create"
            )
        }
    }

    private func ensureConnected() throws {
        if !isConnected {
            throw Exception(
                name: "E_NOT_CONNECTED",
                description:
                    "Client not connected to server yet. Make sure to call connect() first!")
        }
    }

    private func ensureCameraTrack() throws {
        if getLocalCameraTrack() == nil {
            throw Exception(
                name: "E_NO_LOCAL_VIDEO_TRACK",
                description: "No local video track. Make sure to call connect() first!")
        }
    }

    private func ensureAudioTrack() throws {
        if getLocalAudioTrack() == nil {
            throw Exception(
                name: "E_NO_LOCAL_AUDIO_TRACK",
                description: "No local audio track. Make sure to call connect() first!")
        }
    }

    private func ensureScreenBroadcastTrack() throws {
        if getLocalScreenBroadcastTrack() == nil {
            throw Exception(
                name: "E_NO_LOCAL_SCREENSHARE_TRACK",
                description: "No local screen broadcast track. Make sure to toggle screen broadcast on first!")
        }
    }

    private func ensureScreenAppTrack() throws {
        if getLocalScreenAppTrack() == nil {
            throw Exception(
                name: "E_NO_LOCAL_SCREENSHARE_TRACK",
                description: "No local screen app track. Make sure to toggle screen app on first!")
        }
    }

    func onAuthError(reason: FishjamCloudClient.AuthError) {
        if let connectPromise = connectPromise {
            connectPromise.reject("E_MEMBRANE_CONNECT", "Failed to connect: socket error")
        }
        connectPromise = nil
        peerStatus = .error
    }

    func joinRoom(
        url: String, peerToken: String, peerMetadata: [String: Any], config: ConnectConfig,
        promise: Promise
    ) {
      guard connectPromise == nil && peerStatus != .connected else {
        promise.reject("E_MEMBRANE_CONNECT", "Room already joined or it's connecting. You must call leaveRoom() before calling joinRoom() again.")
        return
      }
    
        peerStatus = .connecting
        connectPromise = promise

        let reconnectConfig = FishjamCloudClient.ReconnectConfig(
            maxAttempts: config.reconnectConfig.maxAttempts, initialDelayMs: config.reconnectConfig.initialDelayMs,
            delayMs: config.reconnectConfig.delayMs)

        RNFishjamClient.fishjamClient?.connect(
            config: FishjamCloudClient.ConnectConfig(
                websocketUrl: url, token: peerToken, peerMetadata: peerMetadata.toMetadata(),
                reconnectConfig: reconnectConfig
            ))

    }

    func leaveRoom() {
        connectPromise?.reject("E_MEMBRANE_CONNECT", "leaveRoom called before connected")
        connectPromise = nil
        if isScreenShareOn {
            let screenShareExtensionBundleId =
                Bundle.main.infoDictionary?["ScreenShareExtensionBundleId"] as? String
            DispatchQueue.main.async {
                RPSystemBroadcastPickerView.show(for: screenShareExtensionBundleId)
            }
        }
        _isMicrophoneOn = false
        isCameraOn = false
        isScreenShareOn = false
        isAppScreenShareOn = false
        isConnected = false
        isCameraInitialized = false
        RNFishjamClient.fishjamClient?.leave { [weak self] in
            self?.emitEndpoints()
        }
    }

    private let startCameraLock = NSLock()

    func startCamera(config: CameraConfig) async throws -> Bool {
        #if targetEnvironment(simulator)
            emit(
                event: .warning(
                    message: "Camera is not supported on simulator."))
            return false
        #endif

        try ensureCreated()

        guard await PermissionUtils.requestCameraPermission() else {
            emit(event: .warning(message: "Camera permission not granted."))
            return false
        }

        return try startCameraLock.withLock {
            guard !isCameraInitialized else {
                return true
            }

            let cameraTrack = try createCameraTrack(config: config)
            cameraTrack.captureDeviceChangedListener = self
            setCameraTrackState(cameraTrack, enabled: config.cameraEnabled)
            emitEndpoints()
            isCameraInitialized = true
            return true
        }
    }

    private func createCameraTrack(config: CameraConfig) throws -> LocalCameraTrack {
        try ensureCreated()
        let videoParameters = try getVideoParametersFromOptions(connectionOptions: config)
        videoSimulcastConfig = try getSimulcastConfigFromOptions(simulcastConfig: config.simulcastConfig)
        return RNFishjamClient.fishjamClient!.createVideoTrack(
            videoParameters: videoParameters,
            metadata: config.videoTrackMetadata.toMetadata(),
            captureDeviceName: config.cameraId
        )
    }

    private func setCameraTrackState(_ cameraTrack: LocalCameraTrack, enabled: Bool) {
        cameraTrack.enabled = enabled
        isCameraOn = enabled
        emit(
            event: .currentCameraChanged(
                localCamera: cameraTrack.currentCaptureDevice?.toLocalCamera(), isCameraOn: enabled,
                isCameraInitialized: isCameraInitialized))
        RNFishjamClient.localCameraTracksChangedListenersManager.notifyListeners()
    }

    func toggleCamera() throws -> Bool {
        try ensureCameraTrack()
        setCameraTrackState(getLocalCameraTrack()!, enabled: !isCameraOn)
        return isCameraOn
    }

    func flipCamera() throws {
        try ensureCameraTrack()
        getLocalCameraTrack()?.flipCamera()
    }

    func switchCamera(cameraId: String) throws {
        try ensureCameraTrack()
        getLocalCameraTrack()?.switchCamera(deviceId: cameraId)
    }

    func toggleMicrophone() async throws -> Bool {
        if isMicrophoneOn {
          try stopMicrophone()
        } else {
          try await startMicrophone()
        }

        return isMicrophoneOn
    }

    func startMicrophone() async throws {
        // If microphone track already exist, just enable it
        if let microphoneTrack = getLocalAudioTrack() {
            try setMicrophoneTrackState(microphoneTrack, enabled: true)
        } else {
          guard await PermissionUtils.requestMicrophonePermission() else {
              emit(event: .warning(message: "Microphone permission not granted."))
              return
          }
          let microphoneTrack = RNFishjamClient.fishjamClient!.createAudioTrack(
            metadata: getMicrophoneTrackMetadata(isEnabled: true).toMetadata())
          setAudioSessionMode()
          try setMicrophoneTrackState(microphoneTrack, enabled: true)
          emitEndpoints()
        }
      }
  
    func stopMicrophone() throws {
      guard let microphoneTrack = getLocalAudioTrack() else {
          return
      }
      try setMicrophoneTrackState(microphoneTrack, enabled: false)
    }

    private func getMicrophoneTrackMetadata(isEnabled: Bool) -> [String: Any] {
        return [
            "active": isEnabled,
            "paused": !isEnabled,  //TODO: FCE-711
            "type": "microphone",
        ]
    }
  
  
    // TODO: Microphone state synchronization. Refactor to Actors
    private var _isMicrophoneOn = false
    private let microphoneTrackStateLock = NSLock()

    private func setMicrophoneTrackState(_ microphoneTrack: LocalAudioTrack, enabled: Bool) throws {
      try microphoneTrackStateLock.withLock {
        microphoneTrack.enabled = enabled
        _isMicrophoneOn = enabled
        try updateLocalAudioTrackMetadata(metadata: getMicrophoneTrackMetadata(isEnabled: enabled))
        emit(event: .isMicrophoneOn(enabled: enabled))
      }
    }
  
    var isMicrophoneOn: Bool {
      return microphoneTrackStateLock.withLock {
          return _isMicrophoneOn
      }
    }

    func setAudioSessionMode() {
        guard let localAudioTrack = getLocalAudioTrack() else {
            return
        }

        switch self.audioSessionMode {
        case AVAudioSession.Mode.videoChat:
            localAudioTrack.setVideoChatMode()
            break
        case AVAudioSession.Mode.voiceChat:
            localAudioTrack.setVoiceChatMode()
            break
        default:
            localAudioTrack.setVideoChatMode()
            break
        }
    }

    func toggleScreenShare(screenShareOptions: ScreenShareOptions) throws {
        try ensureCreated()
        try ensureConnected()

        guard isAppScreenShareOn == false else {
            emit(event: .warning(message: "Screensharing screen not available during screensharing app."))
            return
        }
        guard let screenShareExtensionBundleId = Bundle.main.infoDictionary?["ScreenShareExtensionBundleId"] as? String
        else {
            throw Exception(
                name: "E_NO_BUNDLE_ID_SET",
                description:
                    "No screen share extension bundle id set. Please set ScreenShareExtensionBundleId in Info.plist"
            )
        }
        guard let appGroupName = Bundle.main.infoDictionary?["AppGroupName"] as? String
        else {
            throw Exception(
                name: "E_NO_APP_GROUP_SET",
                description: "No app group name set. Please set AppGroupName in Info.plist")
        }

        guard !isScreenShareOn else {
            DispatchQueue.main.async {
                RPSystemBroadcastPickerView.show(for: screenShareExtensionBundleId)
            }
            return
        }

        let simulcastConfig = try getSimulcastConfigFromOptions(simulcastConfig: screenShareOptions.simulcastConfig)

        screenShareSimulcastConfig = simulcastConfig
        let screenShareMetadata = screenShareOptions.screenShareMetadata.toMetadata()
        let videoParameters = getScreenShareVideoParameters(options: screenShareOptions)
        RNFishjamClient.fishjamClient!.prepareForScreenBroadcast(
            appGroup: appGroupName,
            videoParameters: videoParameters,
            metadata: screenShareMetadata,
            canStart: {
                if self.isAppScreenShareOn {
                    self.emit(event: .warning(message: "Screensharing screen not available during screensharing app."))
                }
                return !self.isAppScreenShareOn
            },
            onStart: { [weak self] in
                guard let self else { return }
                do {
                    try setScreenShareTrackState(enabled: true)
                } catch {
                    os_log(
                        "Error starting screen share: %{public}s", log: log, type: .error,
                        String(describing: error)
                    )
                }

            },
            onStop: { [weak self] in
                guard let self else { return }
                do {
                    try setScreenShareTrackState(enabled: false)
                } catch {
                    os_log(
                        "Error stopping screen share: %{public}s", log: log, type: .error,
                        String(describing: error)
                    )
                }
            }
        )
        DispatchQueue.main.async {
            RPSystemBroadcastPickerView.show(for: screenShareExtensionBundleId)
        }
    }

    private func setScreenShareTrackState(enabled: Bool) throws {
        isScreenShareOn = enabled
        emit(event: .isScreenShareOn(enabled: enabled))
    }

    func startScreenAppShare(screenShareOptions: ScreenShareOptions) throws {
        try ensureCreated()
        try ensureConnected()

        let simulcastConfig = try getSimulcastConfigFromOptions(simulcastConfig: screenShareOptions.simulcastConfig)

        screenShareSimulcastConfig = simulcastConfig
        let metadata = screenShareOptions.screenShareMetadata.toMetadata()
        let videoParameters = getScreenShareVideoParameters(options: screenShareOptions)
        let screenAppTrack = RNFishjamClient.fishjamClient!.createScreenAppTrack(
            videoParameters: videoParameters, metadata: metadata)
        setScreenAppTrackState(screenAppTrack, enabled: true)
        emitEndpoints()
    }

    func stopAppScreenShare() throws {
        try ensureScreenAppTrack()
        let track = getLocalScreenAppTrack()!
        setScreenAppTrackState(track, enabled: false)
        RNFishjamClient.fishjamClient?.removeTrack(trackId: track.id)
        emitEndpoints()
    }

    func toggleAppScreenShare(screenShareOptions: ScreenShareOptions) throws {
        guard isScreenShareOn == false else {
            emit(event: .warning(message: "App screensharing not available during screensharing."))
            return
        }
        if getLocalScreenAppTrack() != nil {
            try stopAppScreenShare()
        } else {
            try startScreenAppShare(screenShareOptions: screenShareOptions)
        }
    }

    private func setScreenAppTrackState(_ track: LocalAppScreenShareTrack, enabled: Bool) {
        track.enabled = enabled
        isAppScreenShareOn = enabled
        emit(event: .isAppScreenShareOn(enabled: enabled))
    }

    //returns local endpoint and remote endpoints
    static func getLocalAndRemoteEndpoints() -> [Endpoint] {
        let localEndpoint = RNFishjamClient.fishjamClient!.getLocalEndpoint()
        let remoteEndpoints = RNFishjamClient.fishjamClient!.getRemoteEndpoints()
        return [localEndpoint] + remoteEndpoints
    }

    func getPeers() -> [[String: Any?]] {
        let endpoints = RNFishjamClient.getLocalAndRemoteEndpoints()
        return endpoints.compactMap { endpoint in
            [
                "id": endpoint.id,
                "isLocal": endpoint.id == RNFishjamClient.fishjamClient!.getLocalEndpoint().id,
                "metadata": endpoint.metadata.toDict(),
                "tracks": endpoint.tracks.values.compactMap { track -> [String: Any?]? in
                    switch track {
                    case let track as RemoteVideoTrack:
                        return [
                            "id": track.id,
                            "type": "Video",
                            "metadata": track.metadata.toDict(),
                            "encoding": track.encoding?.description,
                            "encodingReason": track.encodingReason?.rawValue,
                            "aspectRatio": track.dimensions?.aspectRatio,
                        ]

                    case let track as RemoteAudioTrack:
                        return [
                            "id": track.id,
                            "type": "Audio",
                            "metadata": track.metadata.toDict(),
                            "vadStatus": track.vadStatus == .speech ? "speech" : "silence",
                        ]

                    case let track as LocalVideoTrack:
                        return [
                            "id": track.id,
                            "type": "Video",
                            "metadata": track.metadata.toDict(),
                            "aspectRatio": track.dimensions?.aspectRatio,
                        ]
                    case let track as LocalAudioTrack:
                        return [
                            "id": track.id,
                            "type": "Audio",
                            "metadata": track.metadata.toDict(),
                        ]

                    default:
                        return nil
                    }
                },
            ]
        }
    }

    func getCaptureDevices() -> [[String: Any]] {
        let devices = LocalCameraTrack.getCaptureDevices()
        return devices.map { $0.toLocalCamera() }
    }

    func updatePeerMetadata(metadata: [String: Any]) throws {
        try ensureConnected()
        RNFishjamClient.fishjamClient?.updatePeerMetadata(metadata: metadata.toMetadata())
    }

    func updateTrackMetadata(trackId: String, metadata: [String: Any]) {
        RNFishjamClient.fishjamClient?.updateTrackMetadata(trackId: trackId, metadata: metadata.toMetadata())
        emitEndpoints()
    }

    func updateLocalVideoTrackMetadata(metadata: [String: Any]) throws {
        try ensureCameraTrack()
        if let track = getLocalCameraTrack() {
            updateTrackMetadata(trackId: track.id, metadata: metadata)
        }
    }

    private func updateLocalAudioTrackMetadata(metadata: [String: Any]) throws {
        try ensureAudioTrack()
        if let track = getLocalAudioTrack() {
            updateTrackMetadata(trackId: track.id, metadata: metadata)
        }
    }

    func updateLocalScreenShareTrackMetadata(metadata: [String: Any]) throws {
        try ensureScreenBroadcastTrack()
        if let track = getLocalScreenBroadcastTrack() {
            updateTrackMetadata(trackId: track.id, metadata: metadata)
        }
    }

    private func toggleTrackEncoding(encoding: String, trackId: String, simulcastConfig: SimulcastConfig) throws
        -> SimulcastConfig
    {
        try ensureCreated()
        let trackEncoding = try TrackEncoding(encoding)
        let trackEncodingActive = simulcastConfig.activeEncodings.contains(trackEncoding)
        var updatedEncodings = simulcastConfig.activeEncodings

        if trackEncodingActive {
            RNFishjamClient.fishjamClient?.disableTrackEncoding(trackId: trackId, encoding: trackEncoding)
            updatedEncodings.removeAll(where: { encoding in trackEncoding == encoding })
        } else {
            RNFishjamClient.fishjamClient?.enableTrackEncoding(trackId: trackId, encoding: trackEncoding)
            updatedEncodings += [trackEncoding]
        }

        return SimulcastConfig(enabled: true, activeEncodings: updatedEncodings)
    }

    func toggleScreenShareTrackEncoding(encoding: String) throws -> [String: Any?] {
        try ensureScreenBroadcastTrack()
        if let track = getLocalScreenBroadcastTrack() {
            screenShareSimulcastConfig = try toggleTrackEncoding(
                encoding: encoding, trackId: track.id, simulcastConfig: screenShareSimulcastConfig)
        }

        return EmitableEvent.simulcastConfigUpdate(simulcastConfig: screenShareSimulcastConfig).data
    }

    func setScreenShareTrackBandwidth(bandwidth: Int) throws {
        try ensureScreenBroadcastTrack()
        if let track = getLocalScreenBroadcastTrack() {
            RNFishjamClient.fishjamClient?.setTrackBandwidth(trackId: track.id, bandwidthLimit: bandwidth)
        }
    }

    func setScreenShareTrackEncodingBandwidth(encoding: String, bandwidth: Int) throws {
        try ensureScreenBroadcastTrack()
        if let track = getLocalScreenBroadcastTrack() {
            RNFishjamClient.fishjamClient?.setEncodingBandwidth(
                trackId: track.id, encoding: encoding, bandwidthLimit: bandwidth)
        }
    }

    func setTargetTrackEncoding(trackId: String, encoding: String) throws {
        try ensureConnected()
        let trackEncoding = try TrackEncoding(encoding)
        RNFishjamClient.fishjamClient?.setTargetTrackEncoding(trackId: trackId, encoding: trackEncoding)
    }

    func toggleVideoTrackEncoding(encoding: String) throws -> [String: Any?] {
        try ensureCameraTrack()
        try ensureConnected()

        let track = getLocalCameraTrack()!
        videoSimulcastConfig = try toggleTrackEncoding(
            encoding: encoding, trackId: track.id, simulcastConfig: videoSimulcastConfig)

        let event = EmitableEvent.simulcastConfigUpdate(simulcastConfig: videoSimulcastConfig)
        emit(event: event)

        return event.data
    }

    func setVideoTrackEncodingBandwidth(encoding: String, bandwidth: Int) throws {
        try ensureCameraTrack()
        let track = getLocalCameraTrack()!
        RNFishjamClient.fishjamClient?.setEncodingBandwidth(
            trackId: track.id, encoding: encoding, bandwidthLimit: bandwidth)
    }

    func setVideoTrackBandwidth(bandwidth: Int) throws {
        try ensureCameraTrack()
        let track = getLocalCameraTrack()!
        RNFishjamClient.fishjamClient?.setTrackBandwidth(trackId: track.id, bandwidthLimit: bandwidth)
    }

    func changeWebRTCLoggingSeverity(severity: String) throws {
        switch severity {
        case "verbose":
            RNFishjamClient.fishjamClient?.changeWebRTCLoggingSeverity(severity: .verbose)
        case "info":
            RNFishjamClient.fishjamClient?.changeWebRTCLoggingSeverity(severity: .info)
        case "warning":
            RNFishjamClient.fishjamClient?.changeWebRTCLoggingSeverity(severity: .warning)
        case "error":
            RNFishjamClient.fishjamClient?.changeWebRTCLoggingSeverity(severity: .error)
        case "none":
            RNFishjamClient.fishjamClient?.changeWebRTCLoggingSeverity(severity: .none)
        default:
            throw Exception(
                name: "E_INVALID_SEVERITY_LEVEL",
                description: "Severity with name=\(severity) not found")
        }
    }

    private func rtcOutboundStatsToRNMap(obj: RTCOutboundStats) -> [String: Any] {
        var innerMap: [String: Double] = [:]

        innerMap["bandwidth"] = obj.qualityLimitationDurations?.bandwidth ?? 0.0
        innerMap["cpu"] = obj.qualityLimitationDurations?.cpu ?? 0.0
        innerMap["none"] = obj.qualityLimitationDurations?.none ?? 0.0
        innerMap["other"] = obj.qualityLimitationDurations?.other ?? 0.0

        var res: [String: Any] = [:]
        res["kind"] = obj.kind
        res["rid"] = obj.rid
        res["bytesSent"] = obj.bytesSent
        res["targetBitrate"] = obj.targetBitrate
        res["packetsSent"] = obj.packetsSent
        res["framesEncoded"] = obj.framesEncoded
        res["framesPerSecond"] = obj.framesPerSecond
        res["frameWidth"] = obj.frameWidth
        res["frameHeight"] = obj.frameHeight
        res["qualityLimitationDurations"] = innerMap

        return res
    }

    private func rtcInboundStatsToRNMap(obj: RTCInboundStats) -> [String: Any] {
        var res: [String: Any] = [:]
        res["kind"] = obj.kind
        res["jitter"] = obj.jitter
        res["packetsLost"] = obj.packetsLost
        res["packetsReceived"] = obj.packetsReceived
        res["bytesReceived"] = obj.bytesReceived
        res["framesReceived"] = obj.framesReceived
        res["frameWidth"] = obj.frameWidth
        res["frameHeight"] = obj.frameHeight
        res["framesPerSecond"] = obj.framesPerSecond
        res["framesDropped"] = obj.framesDropped

        return res
    }

    func getStatistics() async throws -> [String: Any] {
        try ensureCreated()

        let stats = await RNFishjamClient.fishjamClient!.getStats()

        let pairs = stats.map { (key, value) in
            let rnValue =
                value is RTCOutboundStats
                ? rtcOutboundStatsToRNMap(obj: value as! RTCOutboundStats)
                : rtcInboundStatsToRNMap(obj: value as! RTCInboundStats)
            return (key, rnValue)
        }

        return Dictionary(uniqueKeysWithValues: pairs)
    }

    private func getScreenShareVideoParameters(options: ScreenShareOptions) -> VideoParameters {
        let preset: VideoParameters
        switch options.quality {
        case "VGA":
            preset = VideoParameters.presetScreenShareVGA
        case "HD5":
            preset = VideoParameters.presetScreenShareHD5
        case "HD15":
            preset = VideoParameters.presetScreenShareHD15
        case "FHD15":
            preset = VideoParameters.presetScreenShareFHD15
        case "FHD30":
            preset = VideoParameters.presetScreenShareFHD30
        default:
            preset = VideoParameters.presetScreenShareHD15
        }
        return VideoParameters(
            dimensions: preset.dimensions.flipped,
            maxFps: preset.maxFps,
            simulcastConfig: screenShareSimulcastConfig
        )
    }

    func emit(event: EmitableEvent) {
        DispatchQueue.main.async {
            RNFishjamClient.sendEvent?(event)
        }
    }

    func emitEndpoints() {
        emit(event: .peersUpdate())
    }

    func onJoined(peerID: String, peersInRoom: [String: Endpoint]) {
        isConnected = true
        connectPromise?.resolve(nil)
        connectPromise = nil
        emitEndpoints()
        peerStatus = .connected
    }

    func onJoinError(metadata: Any) {
        let reason = (metadata as? [String: Any])?["reason"] as? String ?? "Unknown error"
        connectPromise?.reject("E_MEMBRANE_CONNECT", "Failed to join room, reason: \(reason)")
        connectPromise = nil
    }

    private func addOrUpdateTrack(_ track: Track) {
        if track is RemoteAudioTrack {
            (track as! RemoteAudioTrack).setVadChangedListener { track in
                self.emitEndpoints()
            }
        }

        if track is RemoteVideoTrack {
            (track as! RemoteVideoTrack).setOnEncodingChangedListener { track in
                self.emitEndpoints()
            }
        }

        RNFishjamClient.tracksUpdateListenersManager.notifyListeners()

        emitEndpoints()
    }

    func onTrackReady(track: Track) {
        addOrUpdateTrack(track)
    }

    func onTrackAdded(track: Track) {
        emitEndpoints()
    }

    func onTrackRemoved(track: Track) {
        emitEndpoints()
    }

    func onTrackUpdated(track: Track) {
        emitEndpoints()
    }

    func onPeerJoined(endpoint: Endpoint) {
        emitEndpoints()
    }

    func onPeerLeft(endpoint: Endpoint) {
        emitEndpoints()
    }

    func onPeerUpdated(endpoint: Endpoint) {
        emitEndpoints()
    }

    func onSocketClose(code: UInt16, reason: String) {
        if let connectPromise = connectPromise {
            connectPromise.reject(
                "E_MEMBRANE_CONNECT", "Failed to connect: socket close, code: \(code), reason: \(reason)")
        }
        connectPromise = nil
        peerStatus = .idle
    }

    func onSocketError(_ errorMessage: String? = nil) {
        connectPromise?.reject("E_MEMBRANE_CONNECT", "Failed to connect: socket error\(errorMessage.map { " - \($0)" } ?? "")")
        connectPromise = nil
        peerStatus = .error
    }

    func onSocketOpen() {}

    func onDisconnected() {
        peerStatus = .idle
    }

    func selectAudioSessionMode(sessionMode: String) throws {
        switch sessionMode {
        case "videoChat":
            self.audioSessionMode = AVAudioSession.Mode.videoChat
            break
        case "voiceChat":
            self.audioSessionMode = AVAudioSession.Mode.voiceChat
            break
        default:
            throw Exception(
                name: "E_MEMBRANE_AUDIO_SESSION",
                description:
                    "Invalid audio session mode: \(sessionMode). Supported modes: videoChat, voiceChat"
            )
        }
        setAudioSessionMode()
    }

    func showAudioRoutePicker() {
        DispatchQueue.main.sync {
            let pickerView = AVRoutePickerView()
            if let button = pickerView.subviews.first(where: { $0 is UIButton }) as? UIButton {
                button.sendActions(for: .touchUpInside)
            }
        }
    }

    func startAudioSwitcher() {
        onRouteChangeNotification()
    }

    @objc func onRouteChangeNotification() {
        emit(event: .audioDeviceUpdate(currentRoute: AVAudioSession.sharedInstance().currentRoute))
    }

    func onBandwidthEstimationChanged(estimation: Int) {
        emit(event: .bandwidthEstimation(estimation: estimation))
    }

    func onReconnectionStarted() {
        reconnectionStatus = .reconnecting
    }

    func onReconnected() {
        reconnectionStatus = .idle
    }

    func onReconnectionRetriesLimitReached() {
        reconnectionStatus = .error
    }

    func onIncompatibleTracksDetected() {
        // TODO: FCE-1215 Add proper url after docs are updated
        emit(
            event: .warning(
                message:
                    "Incompatible track detected. This usually means your device is missing codecs negotiated for the room. Visit https://docs.fishjam.io/category/react-native-integration for information."
            ))
    }

    static func add(customSource: CustomSource) async throws {
        try await fishjamClient?.create(customSource: customSource)
    }

    static func remove(customSource: CustomSource) {
        fishjamClient?.remove(customSource: customSource)
    }
}

extension RNFishjamClient: CameraCapturerDeviceChangedListener {
    func onCaptureDeviceChanged(_ device: AVCaptureDevice?) {
        emit(
            event: .currentCameraChanged(
                localCamera: device?.toLocalCamera(), isCameraOn: isCameraOn, isCameraInitialized: isCameraInitialized))
    }
}
