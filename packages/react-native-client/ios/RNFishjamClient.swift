import AVKit
import ExpoModulesCore
import FishjamCloudClient
import React
import ReplayKit
import WebRTC

class RNFishjamClient: FishjamClientListener {
    var fishjamClient: FishjamClient? = nil
    
    var isMicrophoneOn = false
    var isCameraOn = false
    var isScreencastOn = false
    var isConnected = false

    var connectPromise: Promise? = nil

    var videoSimulcastConfig: SimulcastConfig = SimulcastConfig()
    var localUserMetadata: Metadata = .init()

    var screencastSimulcastConfig: SimulcastConfig = SimulcastConfig()
    var screencastMaxBandwidth: TrackBandwidthLimit = .BandwidthLimit(0)

    var captureDeviceId: String? = nil

    var audioSessionMode: AVAudioSession.Mode = AVAudioSession.Mode.videoChat
    var errorMessage: String?

    let sendEvent: (_ eventName: String, _ data: [String: Any]) -> Void

    init(sendEvent: @escaping (_ eventName: String, _ data: [String: Any]) -> Void) {
        self.sendEvent = sendEvent
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(onRouteChangeNotification),
            name: AVAudioSession.routeChangeNotification,
            object: nil
        )
    }

    private func getSimulcastConfigFromOptions(simulcastConfig: RNSimulcastConfig) -> SimulcastConfig
    {
        var activeEncodings: [TrackEncoding]
        
        for encoding in simulcastConfig.activeEncodings{
            if let fishjamEncoding = TrackEncoding.fromString(encoding){
                activeEncodings.append(fishjamEncoding)
            }
        }

        return SimulcastConfig(
            enabled: simulcastConfig.enabled,
            activeEncodings: activeEncodings
        )
    }

    private func getMaxBandwidthFromOptions(maxBandwidth: RNTrackBandwidthLimit)
        -> TrackBandwidthLimit
    {
        if let maxBandwidth: Int = maxBandwidth.get() {
            return .BandwidthLimit(maxBandwidth)
        } else if let maxBandwidth: [String: Int] = maxBandwidth.get() {
            return .SimulcastBandwidthLimit(maxBandwidth)
        }
        return .BandwidthLimit(0)
    }

    func create() {
        self.fishjamClient = FishjamClient(listener: self)
    }

    func getVideoParametersFromOptions(connectionOptions: CameraConfig) -> VideoParameters {
        let videoQuality = connectionOptions.quality
        let flipVideo = connectionOptions.flipVideo
        let videoBandwidthLimit = getMaxBandwidthFromOptions(
            maxBandwidth: connectionOptions.maxBandwidth)
        let simulcastConfig =
            getSimulcastConfigFromOptions(simulcastConfig: connectionOptions.simulcastConfig)

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
            dimensions: flipVideo ? preset.dimensions.flip() : preset.dimensions,
            maxBandwidth: videoBandwidthLimit,
            simulcastConfig: simulcastConfig
        )
        return videoParameters
    }

    private func getLocalVideoTrack() -> LocalVideoTrack? {
        return fishjamClient?.getLocalEndpoint().tracks.first { $0.value is LocalVideoTrack }?.value as? LocalVideoTrack
    }

    private func getLocalAudioTrack() -> LocalAudioTrack? {
        return fishjamClient?.getLocalEndpoint().tracks.first { $0.value is LocalAudioTrack }?.value as? LocalAudioTrack
    }

    private func getLocalScreencastTrack() -> LocalScreencastTrack? {
        return fishjamClient?.getLocalEndpoint().tracks.first { $0.value is LocalScreencastTrack }?.value as? LocalScreencastTrack
    }
    
    private func ensureCreated() throws{
        if fishjamClient == nil {
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

    private func ensureScreencastTrack() throws {
        if getLocalScreencastTrack() == nil {
            throw Exception(
                name: "E_NO_LOCAL_SCREENCAST_TRACK",
                description: "No local screencast track. Make sure to toggle screencast on first!")
        }
    }
    
    func onAuthError() {
        if let connectPromise = connectPromise {
            connectPromise.reject("E_MEMBRANE_CONNECT", "Failed to connect: socket error")
        }
        connectPromise = nil
    }
    
    func onAuthSuccess() {
        joinRoom()
    }

    func connect(url: String, peerToken: String, peerMetadata: [String: Any], promise: Promise) {
        connectPromise = promise
        localUserMetadata = peerMetadata.toMetadata()
        fishjamClient?.connect(config: ConnectionConfig(websocketUrl: url, token: peerToken))
    }
    
    func joinRoom() {
        fishjamClient?.join(peerMetadata: localUserMetadata)
    }
    
    func leaveRoom() {
        if isScreencastOn {
            let screencastExtensionBundleId =
                Bundle.main.infoDictionary?["ScreencastExtensionBundleId"] as? String
            DispatchQueue.main.async {
                RPSystemBroadcastPickerView.show(for: screencastExtensionBundleId)
            }
        }
        isMicrophoneOn = false
        isCameraOn = false
        isScreencastOn = false
        isConnected = false
        fishjamClient?.leave()
    }
    
    func startCamera(config: CameraConfig) throws {
        try ensureCreated()
        let cameraTrack = try createCameraTrack(config: config)
        setCameraTrackState(cameraTrack, enabled: config.cameraEnabled)
        emitEndpoints()
    }
    
    private func createCameraTrack(config: CameraConfig) throws -> LocalVideoTrack {
        try ensureCreated()
        let videoParameters = getVideoParametersFromOptions(connectionOptions: config)
        videoSimulcastConfig = getSimulcastConfigFromOptions(simulcastConfig: config.simulcastConfig)
        return fishjamClient!.createVideoTrack(
            videoParameters: videoParameters,
            metadata: config.videoTrackMetadata.toMetadata(),
            captureDeviceName: config.captureDeviceId
        )
    }
    
    private func setCameraTrackState(_ cameraTrack: LocalVideoTrack, enabled: Bool) {
        cameraTrack.enabled = enabled
        isCameraOn = enabled
        let eventName = EmitableEvents.IsCameraOn
        let isCameraEnabledMap = [eventName: enabled]
        emitEvent(name: eventName, data: isCameraEnabledMap)
    }
    
    func toggleCamera() throws {
        try ensureVideoTrack()
        setCameraTrackState(getLocalVideoTrack()!, enabled: !isCameraOn)
    }

    func flipCamera() throws {
        try ensureVideoTrack()
        getLocalVideoTrack()?.flipCamera()
    }

    func switchCamera(captureDeviceId: String) throws {
        try ensureVideoTrack()
        getLocalVideoTrack()?.switchCamera(deviceId: captureDeviceId)

    }
    
    func startMicrophone(config: MicrophoneConfig) throws {
        try ensureCreated()
        try ensureConnected()
        let microphoneTrack = fishjamClient!.createAudioTrack(metadata: config.audioTrackMetadata.toMetadata())
        setAudioSessionMode()
        setMicrophoneTrackState(microphoneTrack, enabled: config.microphoneEnabled)
    }
    
    private func setMicrophoneTrackState(_ microphoneTrack: LocalAudioTrack, enabled: Bool){
        microphoneTrack.enabled = enabled
        isMicrophoneOn = enabled
        let eventName = EmitableEvents.IsMicrophoneOn
        let isMicrophoneOnMap = [eventName: enabled]
        emitEvent(name: eventName, data: isMicrophoneOnMap)
    }
    
    func toggleMicrophone() throws {
        try ensureAudioTrack()
        setMicrophoneTrackState(getLocalAudioTrack()!, enabled: !isMicrophoneOn)
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
    
    func toggleScreencast(screencastOptions: ScreencastOptions) throws {
        try ensureCreated()
        try ensureConnected()
        guard let screencastExtensionBundleId = Bundle.main.infoDictionary?["ScreencastExtensionBundleId"] as? String
        else {
            throw Exception(
                name: "E_NO_BUNDLE_ID_SET",
                description:
                    "No screencast extension bundle id set. Please set ScreencastExtensionBundleId in Info.plist"
            )
        }
        guard let appGroupName = Bundle.main.infoDictionary?["AppGroupName"] as? String 
        else {
            throw Exception(
                name: "E_NO_APP_GROUP_SET",
                description: "No app group name set. Please set AppGroupName in Info.plist")
        }

        guard !isScreencastOn 
        else {
            DispatchQueue.main.async {
                RPSystemBroadcastPickerView.show(for: screencastExtensionBundleId)
            }
            return
        }
        
        let simulcastConfig = getSimulcastConfigFromOptions(simulcastConfig: screencastOptions.simulcastConfig)
        
        screencastSimulcastConfig = simulcastConfig
        screencastMaxBandwidth = getMaxBandwidthFromOptions(
            maxBandwidth: screencastOptions.maxBandwidth)
        let screencastMetadata = screencastOptions.screencastMetadata.toMetadata()
        let videoParameters = getScreencastVideoParameters(screencastOptions: screencastOptions)
        fishjamClient!.createScreencastTrack(
            appGroup: appGroupName,
            videoParameters: videoParameters,
            metadata: screencastMetadata,
            onStart: { [weak self] screencastTrack in
                guard let self = self else {
                    DispatchQueue.main.async {
                        RPSystemBroadcastPickerView.show(for: screencastExtensionBundleId)
                    }
                    return
                }
                do {
                    try setScreencastTrackState(screencastTrack, enabled: true)
                } catch {
                    os_log(
                        "Error starting screencast: %{public}s", log: log, type: .error,
                        String(describing: error)
                    )
                }

            },
            onStop: { [weak self] in
                guard let self = self else {
                    return
                }
                do {
                    try setScreencastTrackState(screencastTrack, enabled: false)
                } catch {
                    os_log(
                        "Error stopping screencast: %{public}s", log: log, type: .error,
                        String(describing: error)
                    )
                }
            }
        )
        DispatchQueue.main.async {
            RPSystemBroadcastPickerView.show(for: screencastExtensionBundleId)
        }
    }
    
    private func setScreencastTrackState(_ screencastTrack: LocalScreencastTrack , enabled: Bool) throws {
        //was not present before, test and maybe delete?
        screencastTrack.enabled = enabled
        isScreencastOn = enabled
        let eventName = EmitableEvents.IsScreencastOn
        let isScreencastEnabled = [eventName: enabled]
        emitEvent(name: eventName, data: isScreencastEnabled)
    }
    
    //returns local endpoint and remote endpoints
    private func getLocalAndRemoteEndpoints() throws -> [Endpoint] {
        try ensureCreated()
        let localEndpoint = fishjamClient!.getLocalEndpoint()
        let remoteEndpoints = fishjamClient!.getRemoteEndpoints()
        return [localEndpoint] + remoteEndpoints
    }
    
    func getEndpoints() throws -> [[String: Any?]] {
        let endpoints = try getLocalAndRemoteEndpoints()
        return endpoints.compactMap{ endpoint in
            [
                "id": endpoint.id,
                "isLocal": endpoint.id == fishjamClient!.getLocalEndpoint().id,
                "type": endpoint.type,
                "metadata": endpoint.metadata,
                "tracks": endpoint.tracks.values.compactMap {track -> [String: Any?]? in
                    switch track {
                    case let track as RemoteVideoTrack:
                        return [
                            "id": track.id,
                            "type": "Video",
                            "metadata": track.metadata,
                            "encoding": track.encoding?.description,
                            "encodingReason": track.encodingReason?.rawValue
                        ]

                    case let track as RemoteAudioTrack:
                        return [
                            "id": track.id,
                            "type": "Audio",
                            "metadata": track.metadata,
                            "vadStatus": track.vadStatus.rawValue
                        ]

                    case let track as LocalVideoTrack:
                        return [
                            "id": track.id,
                            "type": "Video",
                            "metadata": track.metadata
                        ]

                    case let track as LocalScreencastTrack:
                        return [
                            "id": track.id,
                            "type": "Video",
                            "metadata": track.metadata
                        ]

                    case let track as LocalAudioTrack:
                        return [
                            "id": track.id,
                            "type": "Audio",
                            "metadata": track.metadata
                        ]

                    default:
                        return nil
                    }
                }
            ]
        }
    }
    
    func getCaptureDevices() -> [[String: Any]] {
        let devices = LocalVideoTrack.getCaptureDevices()
        return devices.map { device -> [String: Any] in
            return [
                "id": device.uniqueID,
                "name": device.localizedName,
                "isFrontFacing": device.position == .front,
                "isBackFacing": device.position == .back,
            ]
        }
    }
    
    func onSocketClose(code: UInt16, reason: String) {
        if let connectPromise = connectPromise {
            connectPromise.reject("E_MEMBRANE_CONNECT", "Failed to connect: socket close, code: \(code), reason: \(reason)")
        }
        connectPromise = nil
    }

    func onSocketError() {
        if let connectPromise = connectPromise {
            connectPromise.reject("E_MEMBRANE_CONNECT", "Failed to connect: socket error")
        }
        connectPromise = nil
    }
    

    func onSocketOpen() {

    }


    func onDisconnected() {

    }

    func onJoined(peerID: String, peersInRoom: [Endpoint]) {
        peersInRoom.forEach { endpoint in
            MembraneRoom.sharedInstance.endpoints[endpoint.id] = RNEndpoint(
                id: endpoint.id, metadata: endpoint.metadata, type: endpoint.type,
                tracks: endpoint.tracks ?? [:]
            )
        }

        emitEndpoints()
        if let connectPromise = connectPromise {
            connectPromise.resolve(nil)
        }
        connectPromise = nil
    }

    func onJoinError(metadata: Any) {
        if let connectPromise = connectPromise {
            connectPromise.reject("E_MEMBRANE_CONNECT", "Failed to join room")
        }
        connectPromise = nil
    }

    func cleanUp() {
        if isScreensharingEnabled {
            let screencastExtensionBundleId =
                Bundle.main.infoDictionary?["ScreencastExtensionBundleId"] as? String
            DispatchQueue.main.async {
                RPSystemBroadcastPickerView.show(for: screencastExtensionBundleId)
            }
        }
        fishjamClient?.cleanUp()
        fishjamClient = nil
        MembraneRoom.sharedInstance.endpoints = [:]
    }

    private func getScreencastVideoParameters(screencastOptions: ScreencastOptions)
        -> VideoParameters
    {
        let preset: VideoParameters
        switch screencastOptions.quality {
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
            maxBandwidth: screencastMaxBandwidth,
            maxFps: preset.maxFps,
            simulcastConfig: screencastSimulcastConfig
        )
    }
  
    private func isTrackLocal(_ trackId: String) -> Bool {
        return trackId == localAudioTrack?.trackId() || trackId == localVideoTrack?.trackId()
            || trackId == localScreencastTrack?.trackId()
    }



    func getSimulcastConfigAsRNMap(simulcastConfig: SimulcastConfig) -> [String: Any] {
        return [
            "enabled": simulcastConfig.enabled,
            "activeEncodings": simulcastConfig.activeEncodings.map { e in e.description },
        ]
    }

    func updateEndpointMetadata(metadata: [String: Any]) throws {
        try ensureConnected()
        fishjamClient?.updatePeerMetadata(metadata: metadata.toMetadata())
    }

    func updateTrackMetadata(trackId: String, metadata: [String: Any]) {
        guard let room = fishjamClient, let endpointId = localEndpointId else {
            return
        }

        room.updateTrackMetadata(trackId: trackId, metadata: metadata.toMetadata())
        let tracksData = MembraneRoom.sharedInstance.endpoints[endpointId]?.tracksData[trackId]
        MembraneRoom.sharedInstance.endpoints[endpointId]?.tracksData[trackId] =
            TrackData(metadata: metadata.toMetadata(), simulcastConfig: tracksData?.simulcastConfig)

        emitEndpoints()
    }

    func updateVideoTrackMetadata(metadata: [String: Any]) throws {
        try ensureVideoTrack()
        guard let trackId = localVideoTrack?.trackId() else {
            return
        }

        updateTrackMetadata(trackId: trackId, metadata: metadata)
    }

    func updateAudioTrackMetadata(metadata: [String: Any]) throws {
        try ensureAudioTrack()
        guard let trackId = localAudioTrack?.trackId() else {
            return
        }

        updateTrackMetadata(trackId: trackId, metadata: metadata)
    }

    func updateScreencastTrackMetadata(metadata: [String: Any]) throws {
        try ensureScreencastTrack()
        guard let trackId = localScreencastTrack?.trackId() else {
            return
        }

        updateTrackMetadata(trackId: trackId, metadata: metadata)
    }

    private func toggleTrackEncoding(
        encoding: TrackEncoding, trackId: String, simulcastConfig: SimulcastConfig
    ) -> SimulcastConfig? {
        guard let room = fishjamClient else {
            return nil
        }
        if simulcastConfig.activeEncodings.contains(encoding) {
            room.disableTrackEncoding(trackId: trackId, encoding: encoding)
            return SimulcastConfig(
                enabled: true,
                activeEncodings: simulcastConfig.activeEncodings.filter { e in e != encoding }
            )
        } else {
            room.enableTrackEncoding(trackId: trackId, encoding: encoding)
            return SimulcastConfig(
                enabled: true,
                activeEncodings: simulcastConfig.activeEncodings + [encoding]
            )
        }
    }

    func toggleScreencastTrackEncoding(encoding: String) throws -> [String: Any] {
        try ensureScreencastTrack()
        let trackEncoding = try validateEncoding(encoding: encoding as String)
        guard
            let trackId = localScreencastTrack?.trackId(),
            let simulcastConfig = toggleTrackEncoding(
                encoding: trackEncoding, trackId: trackId,
                simulcastConfig: screencastSimulcastConfig)
        else {
            throw Exception(
                name: "E_NOT_CONNECTED",
                description:
                    "Client not connected to server yet. Make sure to call connect() first!")
        }
        self.screencastSimulcastConfig = simulcastConfig
        return getSimulcastConfigAsRNMap(simulcastConfig: simulcastConfig)
    }
    func setScreencastTrackBandwidth(bandwidth: Int) throws {
        try ensureScreencastTrack()
        guard let room = fishjamClient, let trackId = localScreencastTrack?.trackId() else {
            return
        }
        room.setTrackBandwidth(trackId: trackId, bandwidthLimit: BandwidthLimit(bandwidth))
    }

    func setScreencastTrackEncodingBandwidth(encoding: String, bandwidth: Int) throws {
        try ensureScreencastTrack()
        let trackEncoding = try validateEncoding(encoding: encoding as String)
        guard let room = fishjamClient, let trackId = localScreencastTrack?.trackId() else {
            return
        }
        room.setEncodingBandwidth(
            trackId: trackId, encoding: trackEncoding.description,
            bandwidthLimit: BandwidthLimit(bandwidth))
    }

    func setTargetTrackEncoding(trackId: String, encoding: String) throws {
        try ensureConnected()
        guard
            let room = fishjamClient,
            let videoTrack = MembraneRoom.sharedInstance.getVideoTrackById(
                trackId: trackId as String),
            let trackId = (videoTrack as? RemoteVideoTrack)?.track.trackId
                ?? (videoTrack as? LocalVideoTrack)?.trackId(),
            let globalTrackId = getGlobalTrackId(localTrackId: trackId as String)
        else {
            throw Exception(
                name: "E_INVALID_TRACK_ID", description: "Remote track with id=\(trackId) not found"
            )
        }
        let trackEncoding = try validateEncoding(encoding: encoding as String)
        room.setTargetTrackEncoding(trackId: globalTrackId, encoding: trackEncoding)
    }

    func toggleVideoTrackEncoding(encoding: String) throws -> [String: Any] {
        try ensureVideoTrack()
        let trackEncoding = try validateEncoding(encoding: encoding as String)
        guard
            let trackId = localVideoTrack?.trackId(),
            let simulcastConfig = toggleTrackEncoding(
                encoding: trackEncoding, trackId: trackId, simulcastConfig: videoSimulcastConfig)
        else {
            throw Exception(
                name: "E_NOT_CONNECTED",
                description:
                    "Client not connected to server yet. Make sure to call connect() first!")
        }
        self.videoSimulcastConfig = simulcastConfig
        let eventName = EmitableEvents.SimulcastConfigUpdate
        emitEvent(
            name: eventName,
            data: getSimulcastConfigAsRNMap(simulcastConfig: simulcastConfig)
        )
        return getSimulcastConfigAsRNMap(simulcastConfig: simulcastConfig)
    }

    func setVideoTrackEncodingBandwidth(encoding: String, bandwidth: Int) throws {
        try ensureVideoTrack()
        guard let room = fishjamClient, let trackId = localVideoTrack?.trackId() else {
            return
        }
        room.setEncodingBandwidth(
            trackId: trackId, encoding: encoding as String,
            bandwidthLimit: BandwidthLimit(bandwidth))
    }

    func setVideoTrackBandwidth(bandwidth: Int) throws {
        try ensureVideoTrack()
        guard let room = fishjamClient, let trackId = localVideoTrack?.trackId() else {
            return
        }
        room.setTrackBandwidth(trackId: trackId, bandwidthLimit: BandwidthLimit(bandwidth))
    }

    func changeWebRTCLoggingSeverity(severity: String) throws {
        switch severity {
        case "verbose":
            fishjamClient?.changeWebRTCLoggingSeverity(severity: .verbose)
        case "info":
            fishjamClient?.changeWebRTCLoggingSeverity(severity: .info)
        case "warning":
            fishjamClient?.changeWebRTCLoggingSeverity(severity: .warning)
        case "error":
            fishjamClient?.changeWebRTCLoggingSeverity(severity: .error)
        case "none":
            fishjamClient?.changeWebRTCLoggingSeverity(severity: .none)
        default:
            throw Exception(
                name: "E_INVALID_SEVERITY_LEVEL",
                description: "Severity with name=\(severity) not found")
        }
    }

    private func getMapFromStatsObject(obj: RTCInboundStats) -> [String: Any] {
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

    private func getMapFromStatsObject(obj: RTCOutboundStats) -> [String: Any] {
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

    private func statsToRNMap(stats: [String: RTCStats]?) -> [String: Any] {
        var res: [String: Any] = [:]
        stats?.forEach { pair in
            if let val = pair.value as? RTCOutboundStats {
                res[pair.key] = getMapFromStatsObject(obj: val)
            } else {
                res[pair.key] = getMapFromStatsObject(obj: pair.value as! RTCInboundStats)
            }
        }
        return res
    }

    func getStatistics() -> [String: Any] {
        return statsToRNMap(stats: fishjamClient?.getStats())
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

    func emitEvent(name: String, data: [String: Any]) {
        sendEvent(name, data)
    }

    func emitEndpoints() {
        let eventName = EmitableEvents.EndpointsUpdate
        let EndpointsUpdateMap = [eventName: getEndpoints()]
        emitEvent(name: eventName, data: EndpointsUpdateMap)
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

    func updateOrAddTrack(ctx: TrackContext) {
        guard var endpoint = MembraneRoom.sharedInstance.endpoints[ctx.endpoint.id] else {
            return
        }
        if let audioTrack = ctx.track as? RemoteAudioTrack {
            let localTrackId = (ctx.track as? RemoteAudioTrack)?.track.trackId
            globalToLocalTrackId[ctx.trackId] = localTrackId
            endpoint.audioTracks[audioTrack.track.trackId] = audioTrack
            let tracksData = endpoint.tracksData[audioTrack.track.trackId]
            endpoint.tracksData[audioTrack.track.trackId] =
                TrackData(metadata: ctx.metadata, simulcastConfig: tracksData?.simulcastConfig)
            if let localTrackId = localTrackId,
                tracksContexts[localTrackId] == nil
            {
                tracksContexts[localTrackId] = ctx
                ctx.setOnVoiceActivityChangedListener { ctx in
                    self.emitEndpoints()
                }
            }
        }

        if let videoTrack = ctx.track as? RemoteVideoTrack {
            let localTrackId = (ctx.track as? RemoteVideoTrack)?.track.trackId
            globalToLocalTrackId[ctx.trackId] = localTrackId
            endpoint.videoTracks[videoTrack.track.trackId] = videoTrack
            let trackData = endpoint.tracksData[videoTrack.track.trackId]

            endpoint.tracksData[videoTrack.track.trackId] =
                TrackData(metadata: ctx.metadata, simulcastConfig: trackData?.simulcastConfig)

            if let localTrackId = localTrackId,
                tracksContexts[localTrackId] == nil
            {
                tracksContexts[localTrackId] = ctx
                ctx.setOnEncodingChangedListener { ctx in
                    self.emitEndpoints()
                }
            }
        }
        MembraneRoom.sharedInstance.endpoints[ctx.endpoint.id] = endpoint
        self.emitEndpoints()
    }

    func onTrackReady(ctx: TrackContext) {
        updateOrAddTrack(ctx: ctx)
    }

    func onTrackAdded(ctx: TrackContext) {

    }

    func onTrackRemoved(ctx: TrackContext) {
        guard var endpoint = MembraneRoom.sharedInstance.endpoints[ctx.endpoint.id] else {
            return
        }
        if let audioTrack = ctx.track as? RemoteAudioTrack {
            endpoint = endpoint.removeTrack(trackId: audioTrack.track.trackId)
        }
        if let videoTrack = ctx.track as? RemoteVideoTrack {
            endpoint = endpoint.removeTrack(trackId: videoTrack.track.trackId)
        }
        globalToLocalTrackId.removeValue(forKey: ctx.trackId)
        MembraneRoom.sharedInstance.endpoints[ctx.endpoint.id] = endpoint
        emitEndpoints()
    }

    func onTrackUpdated(ctx: TrackContext) {
        updateOrAddTrack(ctx: ctx)
    }

    func onPeerJoined(endpoint: Endpoint) {
        MembraneRoom.sharedInstance.endpoints[endpoint.id] = RNEndpoint(
            id: endpoint.id, metadata: endpoint.metadata, type: endpoint.type)
        emitEndpoints()
    }

    func onPeerLeft(endpoint: Endpoint) {
        MembraneRoom.sharedInstance.endpoints.removeValue(forKey: endpoint.id)
        emitEndpoints()
    }

    func onPeerUpdated(endpoint: Endpoint) {

    }

    func onBandwidthEstimationChanged(estimation: Int) {
        let eventName = EmitableEvents.BandwidthEstimation
        emitEvent(name: eventName, data: [eventName: estimation])
    }

}
