import AVKit
import ExpoModulesCore
import FishjamCloudClient
import React
import ReplayKit
import WebRTC

class RNFishjamClient: FishjamClientListener {
    static var fishjamClient: FishjamClient? = nil

    var isMicrophoneOn = false
    var isCameraOn = false
    var isScreenShareOn = false
    var isAppScreenShareOn = false
    var isConnected = false

    private var isCameraInitialized = false

    var connectPromise: Promise? = nil

    var videoSimulcastConfig: SimulcastConfig = SimulcastConfig()
    var localUserMetadata: Metadata = .init()

    var screenShareSimulcastConfig: SimulcastConfig = SimulcastConfig()
    var screenShareMaxBandwidth: TrackBandwidthLimit = .BandwidthLimit(0)

    var cameraId: String? = nil

    var audioSessionMode: AVAudioSession.Mode = .videoChat
    var errorMessage: String?
    
    var currentCamera: LocalCamera? { getLocalCameraTrack()?.currentCaptureDevice?.toLocalCamera() }

    private(set) var peerStatus: PeerStatus = .idle {
        didSet {
            let event = EmitableEvents.PeerStatusChanged
            emit(event: event, data: [event.name: peerStatus.rawValue])
        }
    }

    let sendEvent: (_ eventName: String, _ data: [String: Any?]) -> Void

    static var tracksUpdateListenersManager = TracksUpdateListenersManager()
    static var localCameraTracksChangedListenersManager = LocalCameraTracksChangedListenersManager()

    init(sendEvent: @escaping (_ eventName: String, _ data: [String: Any?]) -> Void) {
        self.sendEvent = sendEvent
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(onRouteChangeNotification),
            name: AVAudioSession.routeChangeNotification,
            object: nil
        )
    }

    private func getSimulcastConfigFromOptions(simulcastConfig: RNSimulcastConfig) throws -> SimulcastConfig {
        var activeEncodings: [TrackEncoding] = []

        for encoding in simulcastConfig.activeEncodings {
            if let fishjamEncoding = try? TrackEncoding(encoding) {
                activeEncodings.append(fishjamEncoding)
            }
        }

        return SimulcastConfig(
            enabled: simulcastConfig.enabled,
            activeEncodings: activeEncodings
        )
    }

    private func getMaxBandwidthFromOptions(maxBandwidth: RNTrackBandwidthLimit) -> TrackBandwidthLimit {
        if let maxBandwidth: Int = maxBandwidth.get() {
            return .BandwidthLimit(maxBandwidth)
        } else if let maxBandwidth: [String: Int] = maxBandwidth.get() {
            return .SimulcastBandwidthLimit(maxBandwidth)
        }
        return .BandwidthLimit(0)
    }

    func create() {
        RNFishjamClient.fishjamClient = FishjamClient(listener: self)
    }

    func getVideoParametersFromOptions(connectionOptions: CameraConfig) throws -> VideoParameters {
        let videoQuality = connectionOptions.quality
        let flipDimensions = connectionOptions.flipDimensions
        let videoBandwidthLimit = getMaxBandwidthFromOptions(maxBandwidth: connectionOptions.maxBandwidth)
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
            maxBandwidth: videoBandwidthLimit,
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
        peerStatus = .connecting
        connectPromise = promise
        localUserMetadata = ["server": [:], "peer": peerMetadata].toMetadata()

        let reconnectConfig = FishjamCloudClient.ReconnectConfig(
            maxAttempts: config.reconnectConfig.maxAttempts, initialDelayMs: config.reconnectConfig.initialDelayMs,
            delayMs: config.reconnectConfig.delayMs)

        RNFishjamClient.fishjamClient?.connect(
            config: FishjamCloudClient.ConnectConfig(
                websocketUrl: url, token: peerToken, peerMetadata: localUserMetadata,
                reconnectConfig: reconnectConfig
            ))

    }

    func leaveRoom() {
        if isScreenShareOn {
            let screenShareExtensionBundleId =
                Bundle.main.infoDictionary?["ScreenShareExtensionBundleId"] as? String
            DispatchQueue.main.async {
                RPSystemBroadcastPickerView.show(for: screenShareExtensionBundleId)
            }
        }
        isMicrophoneOn = false
        isCameraOn = false
        isScreenShareOn = false
        isAppScreenShareOn = false
        isConnected = false
        isCameraInitialized = false
        RNFishjamClient.fishjamClient?.leave { [weak self] in
            self?.emitEndpoints()
        }
    }

    func startCamera(config: CameraConfig) async throws {
        try ensureCreated()

        guard !isCameraInitialized else {
            emit(warning: "Camera already started. You may only call startCamera once before leaveRoom is called.")
            return
        }

        guard await PermissionUtils.requestCameraPermission() else {
            emit(warning: "Camera permission not granted.")
            return
        }

        let cameraTrack = try createCameraTrack(config: config)
        cameraTrack.captureDeviceChangedListener = self
        setCameraTrackState(cameraTrack, enabled: config.cameraEnabled)
        emitEndpoints()
        isCameraInitialized = true
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
        // TODO: Send this as one event?
        emit(event: .CurrentCameraChanged, data: [EmitableEvents.CurrentCameraChanged.name: cameraTrack.currentCaptureDevice?.toLocalCamera()])
        emit(event: .IsCameraOn, data: [EmitableEvents.IsCameraOn.name: enabled])
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
        if let audioTrack = getLocalAudioTrack() {
            setMicrophoneTrackState(audioTrack, enabled: !isMicrophoneOn)
        } else {
            try await startMicrophone()
        }
        return isMicrophoneOn
    }

    func startMicrophone() async throws {
        guard await PermissionUtils.requestMicrophonePermission() else {
            emit(warning: "Microphone permission not granted.")
            return
        }
        let microphoneTrack = RNFishjamClient.fishjamClient!.createAudioTrack(metadata: Metadata())
        setAudioSessionMode()
        setMicrophoneTrackState(microphoneTrack, enabled: true)
        emitEndpoints()
    }

    private func setMicrophoneTrackState(_ microphoneTrack: LocalAudioTrack, enabled: Bool) {
        microphoneTrack.enabled = enabled
        isMicrophoneOn = enabled
        let event = EmitableEvents.IsMicrophoneOn
        let isMicrophoneOnMap = [event.name: enabled]
        emit(event: event, data: isMicrophoneOnMap)
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
            emit(warning: "Screensharing screen not available during screensharing app.")
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
        screenShareMaxBandwidth = getMaxBandwidthFromOptions(
            maxBandwidth: screenShareOptions.maxBandwidth)
        let screenShareMetadata = screenShareOptions.screenShareMetadata.toMetadata()
        let videoParameters = getScreenShareVideoParameters(options: screenShareOptions)
        RNFishjamClient.fishjamClient!.prepareForScreenBroadcast(
            appGroup: appGroupName,
            videoParameters: videoParameters,
            metadata: screenShareMetadata,
            canStart: {
                if self.isAppScreenShareOn {
                    self.emit(warning: "Screensharing screen not available during screensharing app.")
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
        let event = EmitableEvents.IsScreenShareOn
        let isScreenShareEnabled = [event.name: enabled]
        emit(event: event, data: isScreenShareEnabled)
    }

    func startScreenAppShare(screenShareOptions: ScreenShareOptions) throws {
        try ensureCreated()
        try ensureConnected()

        let simulcastConfig = try getSimulcastConfigFromOptions(simulcastConfig: screenShareOptions.simulcastConfig)

        screenShareSimulcastConfig = simulcastConfig
        screenShareMaxBandwidth = getMaxBandwidthFromOptions(maxBandwidth: screenShareOptions.maxBandwidth)
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
            emit(warning: "App screensharing not available during screensharing.")
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
        let event = EmitableEvents.IsAppScreenShareOn
        let eventMap = [event.name: enabled]
        emit(event: event, data: eventMap)
    }

    //returns local endpoint and remote endpoints
    static func getLocalAndRemoteEndpoints() -> [Endpoint] {
        let localEndpoint = RNFishjamClient.fishjamClient!.getLocalEndpoint()
        let remoteEndpoints = RNFishjamClient.fishjamClient!.getRemoteEndpoints()
        return [localEndpoint] + remoteEndpoints
    }

    func getPeers() throws -> [[String: Any?]] {
        let endpoints = RNFishjamClient.getLocalAndRemoteEndpoints()
        return endpoints.compactMap { endpoint in
            [
                "id": endpoint.id,
                "isLocal": endpoint.id == RNFishjamClient.fishjamClient!.getLocalEndpoint().id,
                "type": endpoint.type,
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
                        ]

                    case let track as RemoteAudioTrack:
                        return [
                            "id": track.id,
                            "type": "Audio",
                            "metadata": track.metadata.toDict(),
                            "vadStatus": track.vadStatus.rawValue,
                        ]

                    case let track as LocalCameraTrack:
                        return [
                            "id": track.id,
                            "type": "Video",
                            "metadata": track.metadata.toDict(),
                        ]

                    case let track as LocalBroadcastScreenShareTrack:
                        return [
                            "id": track.id,
                            "type": "Video",
                            "metadata": track.metadata.toDict(),
                        ]

                    case let track as LocalAppScreenShareTrack:
                        return [
                            "id": track.id,
                            "type": "Video",
                            "metadata": track.metadata.toDict(),
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

    func updateLocalAudioTrackMetadata(metadata: [String: Any]) throws {
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

    func toggleScreenShareTrackEncoding(encoding: String) throws -> [String: Any] {
        try ensureScreenBroadcastTrack()
        if let track = getLocalScreenBroadcastTrack() {
            screenShareSimulcastConfig = try toggleTrackEncoding(
                encoding: encoding, trackId: track.id, simulcastConfig: screenShareSimulcastConfig)
        }
        return getSimulcastConfigAsRNMap(screenShareSimulcastConfig)
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

    func toggleVideoTrackEncoding(encoding: String) throws -> [String: Any] {
        try ensureCameraTrack()
        try ensureConnected()

        let track = getLocalCameraTrack()!
        videoSimulcastConfig = try toggleTrackEncoding(
            encoding: encoding, trackId: track.id, simulcastConfig: videoSimulcastConfig)

        let event = EmitableEvents.SimulcastConfigUpdate
        let simulcastConfigAsRNMap = getSimulcastConfigAsRNMap(videoSimulcastConfig)
        emit(event: event, data: simulcastConfigAsRNMap)

        return simulcastConfigAsRNMap
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

    func getStatistics() throws -> [String: Any] {
        try ensureCreated()

        let stats = RNFishjamClient.fishjamClient!.getStats()
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
            maxBandwidth: screenShareMaxBandwidth,
            maxFps: preset.maxFps,
            simulcastConfig: screenShareSimulcastConfig
        )
    }

    func emit(event: EmitableEvents, data: [String: Any?] = [:]) {
        DispatchQueue.main.async { [weak self] in
            self?.sendEvent(event.name, data)
        }
    }

    func emit(warning: String) {
        emit(event: .Warning, data: ["message": warning])
    }

    func emitEndpoints() {
        let event = EmitableEvents.PeersUpdate
        let EndpointsUpdateMap = [event.name: (try? getPeers()) ?? []]
        emit(event: event, data: EndpointsUpdateMap)
    }

    func onJoined(peerID: String, peersInRoom: [String: Endpoint]) {
        isConnected = true
        connectPromise?.resolve(nil)
        connectPromise = nil
        emitEndpoints()
        peerStatus = .connected
    }

    func onJoinError(metadata: Any) {
        connectPromise?.reject("E_MEMBRANE_CONNECT", "Failed to join room")
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
        peerStatus = .error
    }

    func onSocketError() {
        if let connectPromise = connectPromise {
            connectPromise.reject("E_MEMBRANE_CONNECT", "Failed to connect: socket error")
        }
        connectPromise = nil
    }

    func onSocketOpen() {}

    func onDisconnected() {
        peerStatus = .idle
    }

    func getSimulcastConfigAsRNMap(_ simulcastConfig: SimulcastConfig) -> [String: Any] {
        return [
            "enabled": simulcastConfig.enabled,
            "activeEncodings": simulcastConfig.activeEncodings.map { e in e.description },
        ]
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
        let currentRoute = AVAudioSession.sharedInstance().currentRoute
        let output = currentRoute.outputs[0]
        let deviceType = output.portType
        var deviceTypeString: String = ""

        switch deviceType {
        case .bluetoothA2DP, .bluetoothLE, .bluetoothHFP:
            deviceTypeString = "bluetooth"
            break
        case .builtInSpeaker:
            deviceTypeString = "speaker"
            break
        case .builtInReceiver:
            deviceTypeString = "earpiece"
            break
        case .headphones:
            deviceTypeString = "headphones"
            break
        default:
            deviceTypeString = deviceType.rawValue
        }
        let event = EmitableEvents.AudioDeviceUpdate
        emit(
            event: event,
            data: [
                event.name: [
                    "selectedDevice": ["name": output.portName, "type": deviceTypeString],
                    "availableDevices": [],
                ]
            ] as [String: [String: Any]])
    }

    func onBandwidthEstimationChanged(estimation: Int) {
        let event = EmitableEvents.BandwidthEstimation
        emit(event: event, data: [event.name: estimation])
    }

    func onReconnectionStarted() {
        emit(event: .ReconnectionStarted)
    }

    func onReconnected() {
        emit(event: .Reconnected)
    }

    func onReconnectionRetriesLimitReached() {
        emit(event: .ReconnectionRetriesLimitReached)
    }

}

extension RNFishjamClient: CameraCapturerDeviceChangedListener {
    func onCaptureDeviceChanged(_ device: AVCaptureDevice?) {
        let event = EmitableEvents.CurrentCameraChanged
        emit(event: .CurrentCameraChanged, data: [event.name: device?.toLocalCamera()])
    }
}
