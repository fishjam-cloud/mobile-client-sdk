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
    var isConnected = false

    private var isCameraInitialized = false

    var connectPromise: Promise? = nil

    var videoSimulcastConfig: SimulcastConfig = SimulcastConfig()
    var localUserMetadata: Metadata = .init()

    var screenShareSimulcastConfig: SimulcastConfig = SimulcastConfig()
    var screenShareMaxBandwidth: TrackBandwidthLimit = .BandwidthLimit(0)

    var cameraId: String? = nil

    var audioSessionMode: AVAudioSession.Mode = AVAudioSession.Mode.videoChat
    var errorMessage: String?

    let sendEvent: (_ eventName: String, _ data: [String: Any]) -> Void

    static var onTracksUpdateListeners: [OnTrackUpdateListener] = []

    init(sendEvent: @escaping (_ eventName: String, _ data: [String: Any]) -> Void) {
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
            dimensions: flipDimensions ? preset.dimensions.flip() : preset.dimensions,
            maxBandwidth: videoBandwidthLimit,
            simulcastConfig: simulcastConfig
        )
        return videoParameters
    }

    private func getLocalVideoTrack() -> LocalVideoTrack? {
        return RNFishjamClient.fishjamClient?.getLocalEndpoint().tracks.first { $0.value is LocalVideoTrack }?.value
            as? LocalVideoTrack
    }

    private func getLocalAudioTrack() -> LocalAudioTrack? {
        return RNFishjamClient.fishjamClient?.getLocalEndpoint().tracks.first { $0.value is LocalAudioTrack }?.value
            as? LocalAudioTrack
    }

    private func getLocalScreenShareTrack() -> LocalScreenShareTrack? {
        return RNFishjamClient.fishjamClient?.getLocalEndpoint().tracks.first { $0.value is LocalScreenShareTrack }?
            .value as? LocalScreenShareTrack
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

    private func ensureVideoTrack() throws {
        if getLocalVideoTrack() == nil {
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

    private func ensureScreenShareTrack() throws {
        if getLocalScreenShareTrack() == nil {
            throw Exception(
                name: "E_NO_LOCAL_SCREENSHARE_TRACK",
                description: "No local screen share track. Make sure to toggle screen share on first!")
        }
    }

    func onAuthError(reason: FishjamCloudClient.AuthError) {
        if let connectPromise = connectPromise {
            connectPromise.reject("E_MEMBRANE_CONNECT", "Failed to connect: socket error")
        }
        connectPromise = nil
    }

    func onAuthSuccess() {
        join()
    }

    func joinRoom(
        url: String, peerToken: String, peerMetadata: [String: Any], config: ConnectConfig,
        promise: Promise
    ) {
        connectPromise = promise
        localUserMetadata = peerMetadata.toMetadata()

        let reconnectConfig = FishjamCloudClient.ReconnectConfig(
            maxAttempts: config.reconnectConfig.maxAttempts, initialDelayMs: config.reconnectConfig.initialDelayMs,
            delayMs: config.reconnectConfig.delayMs)

        RNFishjamClient.fishjamClient?.connect(
            config: FishjamCloudClient.ConnectConfig(
                websocketUrl: url, token: peerToken, peerMetadata: .init(peerMetadata),
                reconnectConfig: reconnectConfig
            ))

    }

    func join() {
        RNFishjamClient.fishjamClient?.join(peerMetadata: localUserMetadata)
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
        isConnected = false
        isCameraInitialized = false
        RNFishjamClient.fishjamClient?.leave { [weak self] in
            self?.emitEndpoints()
        }
    }

    func startCamera(config: CameraConfig) throws {
        try ensureCreated()

        guard !isCameraInitialized else {
            emit(warning: "Camera already started. You may only call startCamera once before leaveRoom is called.")
            return
        }

        let cameraTrack = try createCameraTrack(config: config)
        setCameraTrackState(cameraTrack, enabled: config.cameraEnabled)
        emitEndpoints()
        isCameraInitialized = true
    }

    private func createCameraTrack(config: CameraConfig) throws -> LocalVideoTrack {
        try ensureCreated()
        let videoParameters = try getVideoParametersFromOptions(connectionOptions: config)
        videoSimulcastConfig = try getSimulcastConfigFromOptions(simulcastConfig: config.simulcastConfig)
        return RNFishjamClient.fishjamClient!.createVideoTrack(
            videoParameters: videoParameters,
            metadata: config.videoTrackMetadata.toMetadata(),
            captureDeviceName: config.cameraId
        )
    }

    private func setCameraTrackState(_ cameraTrack: LocalVideoTrack, enabled: Bool) {
        cameraTrack.enabled = enabled
        isCameraOn = enabled
        let eventName = EmitableEvents.IsCameraOn
        let isCameraEnabledMap = [eventName: enabled]
        emitEvent(name: eventName, data: isCameraEnabledMap)
    }

    func toggleCamera() throws -> Bool {
        try ensureVideoTrack()
        setCameraTrackState(getLocalVideoTrack()!, enabled: !isCameraOn)
        return isCameraOn
    }

    func flipCamera() throws {
        try ensureVideoTrack()
        getLocalVideoTrack()?.flipCamera()
    }

    func switchCamera(cameraId: String) throws {
        try ensureVideoTrack()
        getLocalVideoTrack()?.switchCamera(deviceId: cameraId)

    }

    func toggleMicrophone() throws -> Bool {
        if let audioTrack = getLocalAudioTrack() {
            setMicrophoneTrackState(audioTrack, enabled: !isMicrophoneOn)
        } else {
            try startMicrophone()
        }
        return isMicrophoneOn
    }

    func startMicrophone() throws {
        let microphoneTrack = RNFishjamClient.fishjamClient!.createAudioTrack(
            metadata: Metadata())
        setAudioSessionMode()
        setMicrophoneTrackState(microphoneTrack, enabled: true)
        emitEndpoints()
    }

    private func setMicrophoneTrackState(_ microphoneTrack: LocalAudioTrack, enabled: Bool) {
        microphoneTrack.enabled = enabled
        isMicrophoneOn = enabled
        let eventName = EmitableEvents.IsMicrophoneOn
        let isMicrophoneOnMap = [eventName: enabled]
        print(isMicrophoneOnMap)
        emitEvent(name: eventName, data: isMicrophoneOnMap)
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
        RNFishjamClient.fishjamClient!.createScreenShareTrack(
            appGroup: appGroupName,
            videoParameters: videoParameters,
            metadata: screenShareMetadata,
            onStart: { [weak self] screenShareTrack in
                guard let self = self else { return }

                do {
                    //not sure should it be here, or outside or where?
                    try setScreenShareTrackState(screenShareTrack, enabled: true)
                } catch {
                    os_log(
                        "Error starting screen share: %{public}s", log: log, type: .error,
                        String(describing: error)
                    )
                }

            },
            onStop: { [weak self] screenShareTrack in
                guard let self = self else { return }
                do {
                    //not sure should it be here, or outside or where?
                    try setScreenShareTrackState(screenShareTrack, enabled: false)
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

    private func setScreenShareTrackState(_ screenShareTrack: LocalScreenShareTrack, enabled: Bool) throws {
        //was not present before, test and maybe delete?
        screenShareTrack.enabled = enabled
        isScreenShareOn = enabled
        let eventName = EmitableEvents.IsScreenShareOn
        let isScreenShareEnabled = [eventName: enabled]
        emitEvent(name: eventName, data: isScreenShareEnabled)
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
                "metadata": endpoint.metadata,
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

                    case let track as LocalVideoTrack:
                        return [
                            "id": track.id,
                            "type": "Video",
                            "metadata": track.metadata.toDict(),
                        ]

                    case let track as LocalScreenShareTrack:
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
        let devices = LocalVideoTrack.getCaptureDevices()
        return devices.map { device -> [String: Any] in
            let facingDirection =
                switch device.position {
                case .front: "front"
                case .back: "back"
                default: "unspecified"
                }
            return [
                "id": device.uniqueID,
                "name": device.localizedName,
                "facingDirection": facingDirection,
            ]
        }
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
        try ensureVideoTrack()
        if let track = getLocalVideoTrack() {
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
        try ensureScreenShareTrack()
        if let track = getLocalScreenShareTrack() {
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
        try ensureScreenShareTrack()
        if let track = getLocalScreenShareTrack() {
            screenShareSimulcastConfig = try toggleTrackEncoding(
                encoding: encoding, trackId: track.id, simulcastConfig: screenShareSimulcastConfig)
        }
        return getSimulcastConfigAsRNMap(screenShareSimulcastConfig)
    }

    func setScreenShareTrackBandwidth(bandwidth: Int) throws {
        try ensureScreenShareTrack()
        if let track = getLocalScreenShareTrack() {
            RNFishjamClient.fishjamClient?.setTrackBandwidth(trackId: track.id, bandwidthLimit: bandwidth)
        }
    }

    func setScreenShareTrackEncodingBandwidth(encoding: String, bandwidth: Int) throws {
        try ensureScreenShareTrack()
        if let track = getLocalScreenShareTrack() {
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
        try ensureVideoTrack()
        try ensureConnected()

        let track = getLocalVideoTrack()!
        videoSimulcastConfig = try toggleTrackEncoding(
            encoding: encoding, trackId: track.id, simulcastConfig: videoSimulcastConfig)

        let eventName = EmitableEvents.SimulcastConfigUpdate
        let simulcastConfigAsRNMap = getSimulcastConfigAsRNMap(videoSimulcastConfig)
        emitEvent(name: eventName, data: simulcastConfigAsRNMap)

        return simulcastConfigAsRNMap
    }

    func setVideoTrackEncodingBandwidth(encoding: String, bandwidth: Int) throws {
        try ensureVideoTrack()
        let track = getLocalVideoTrack()!
        RNFishjamClient.fishjamClient?.setEncodingBandwidth(
            trackId: track.id, encoding: encoding, bandwidthLimit: bandwidth)
    }

    func setVideoTrackBandwidth(bandwidth: Int) throws {
        try ensureVideoTrack()
        let track = getLocalVideoTrack()!
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
            dimensions: preset.dimensions.flip(),
            maxBandwidth: screenShareMaxBandwidth,
            maxFps: preset.maxFps,
            simulcastConfig: screenShareSimulcastConfig
        )
    }

    func emitEvent(name: String, data: [String: Any]) {
        sendEvent(name, data)
    }

    func emit(warning: String) {
        emitEvent(name: EmitableEvents.Warning, data: ["message": warning])
    }

    func emitEndpoints() {
        let eventName = EmitableEvents.PeersUpdate
        let EndpointsUpdateMap = [eventName: (try? getPeers()) ?? []]
        emitEvent(name: eventName, data: EndpointsUpdateMap)
    }

    func onJoined(peerID: String, peersInRoom: [String: Endpoint]) {
        isConnected = true
        connectPromise?.resolve(nil)
        connectPromise = nil
        emitEndpoints()
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

        RNFishjamClient.onTracksUpdateListeners.forEach {
            $0.onTrackUpdate()
        }

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
    }

    func onSocketError() {
        if let connectPromise = connectPromise {
            connectPromise.reject("E_MEMBRANE_CONNECT", "Failed to connect: socket error")
        }
        connectPromise = nil
    }

    func onSocketOpen() {}

    func onDisconnected() {}

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
        let eventName = EmitableEvents.AudioDeviceUpdate
        emitEvent(
            name: eventName,
            data: [
                eventName: [
                    "selectedDevice": ["name": output.portName, "type": deviceTypeString],
                    "availableDevices": [],
                ]
            ] as [String: [String: Any]])
    }

    func onBandwidthEstimationChanged(estimation: Int) {
        let eventName = EmitableEvents.BandwidthEstimation
        emitEvent(name: eventName, data: [eventName: estimation])
    }

    func onReconnectionStarted() {
        emitEvent(name: EmitableEvents.ReconnectionStarted, data: [:])
    }

    func onReconnected() {
        emitEvent(name: EmitableEvents.Reconnected, data: [:])
    }

    func onReconnectionRetriesLimitReached() {
        emitEvent(name: EmitableEvents.ReconnectionRetriesLimitReached, data: [:])
    }

}
