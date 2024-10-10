import Foundation
import Promises
import Starscream
import WebRTC

class FishjamClientInternal {
    private var config: ConnectConfig?
    private let commandsQueue: CommandsQueue = CommandsQueue()
    private var webSocket: FishjamWebsocket?
    private var listener: FishjamClientListener
    private var websocketFactory: (String) -> FishjamWebsocket
    private var peerConnectionManager: PeerConnectionManager
    private var peerConnectionFactoryWrapper: PeerConnectionFactoryWrapper
    private var rtcEngineCommunication: RTCEngineCommunication
    private var isAuthenticated = false

    private var broadcastScreenShareReceiver: BroadcastScreenShareReceiver?
    private var broadcastScreenShareCapturer: BroadcastScreenShareCapturer?

    private var reconnectionManager: ReconnectionManager?

    private var _loggerPrefix = "FishjamClientInternal"

    private(set) var localEndpoint: Endpoint = Endpoint(id: "", type: .EXWEBRTC)
    private var prevTracks: [Track] = []
    private var remoteEndpointsMap: [String: Endpoint] = [:]

    public init(listener: FishjamClientListener, websocketFactory: @escaping (String) -> FishjamWebsocket) {
        self.listener = listener
        self.websocketFactory = websocketFactory
        self.rtcEngineCommunication = RTCEngineCommunication(listeners: [])
        self.peerConnectionFactoryWrapper = PeerConnectionFactoryWrapper(encoder: Encoder.DEFAULT)
        self.peerConnectionManager = PeerConnectionManager(
            config: RTCConfiguration(), peerConnectionFactory: peerConnectionFactoryWrapper)
    }

    private func getTrack(trackId: String) -> Track? {
        if let track = localEndpoint.tracks[trackId] {
            return track
        }
        for endpoint in remoteEndpointsMap.values {
            if let track = endpoint.tracks[trackId] {
                return track
            }
        }
        return nil
    }

    private func getTrackWithRtcEngineId(trackId: String) -> Track? {
        if let track = localEndpoint.tracks.values.first(where: { $0.webrtcId == trackId }) {
            return track
        }
        for endpoint in remoteEndpointsMap.values {
            if let track = endpoint.tracks.values.first(where: { $0.rtcEngineId == trackId }) {
                return track
            }
        }

        return nil
    }

    func connect(config: ConnectConfig) {
        self.config = config
        peerConnectionManager.addListener(self)
        rtcEngineCommunication.addListener(self)
        self.reconnectionManager = ReconnectionManager(
            reconnectConfig: config.reconnectConfig, connect: { self.reconnect(config: config) }, listener: listener)
        setupWebsocket(config: config)
    }

    func reconnect(config: ConnectConfig) {
        recreateTracks()
        setupWebsocket(config: config)
    }

    func setupWebsocket(config: ConnectConfig) {
        commandsQueue.addCommand(
            Command(commandName: .CONNECT, clientStateAfterCommand: .CONNECTED) {
                self.webSocket = self.websocketFactory(config.websocketUrl)
                self.webSocket?.delegate = self
                self.webSocket?.connect()
            }
        )
    }

    func join() {
        commandsQueue.addCommand(
            Command(commandName: .JOIN, clientStateAfterCommand: .JOINED) {
                self.localEndpoint = self.localEndpoint.copyWith(metadata: self.config?.peerMetadata)
                self.rtcEngineCommunication.connect(metadata: self.localEndpoint.metadata)
            })
    }

    func leave(onLeave: (() -> Void)? = nil) {
        rtcEngineCommunication.disconnect()
        for track in localEndpoint.tracks.values {
            if let track = track as? LocalTrack {
                track.stop()
            }
        }
        peerConnectionManager.close()
        localEndpoint = Endpoint(id: "", type: .EXWEBRTC)
        remoteEndpointsMap = [:]
        peerConnectionManager.removeListener(self)
        rtcEngineCommunication.removeListener(self)
        webSocket?.disconnect(closeCode: CloseCode.normal.rawValue)
        webSocket = nil
        isAuthenticated = false
        commandsQueue.clear()
        onLeave?()
    }

    func createCameraTrack(videoParameters: VideoParameters, metadata: Metadata, captureDeviceName: String? = nil)
        -> LocalCameraTrack
    {
        let videoSource = peerConnectionFactoryWrapper.createVideoSource()
        let webrtcTrack = peerConnectionFactoryWrapper.createVideoTrack(source: videoSource)
        let videoCapturer = CameraCapturer(
            videoParameters: videoParameters, delegate: videoSource, deviceId: captureDeviceName)
        let videoTrack = LocalCameraTrack(
            mediaTrack: webrtcTrack, videoSource: videoSource, endpointId: localEndpoint.id, metadata: metadata,
            videoParameters: videoParameters,
            capturer: videoCapturer)
        videoTrack.start()
        let promise = commandsQueue.addCommand(
            Command(commandName: .ADD_TRACK, clientStateAfterCommand: nil) {
                self.localEndpoint = self.localEndpoint.addOrReplaceTrack(videoTrack)
                self.peerConnectionManager.addTrack(track: videoTrack)
                if self.commandsQueue.clientState == .CONNECTED || self.commandsQueue.clientState == .JOINED {
                    self.rtcEngineCommunication.renegotiateTracks()
                } else {
                    self.commandsQueue.finishCommand(commandName: .ADD_TRACK)
                }
            })
        do {
            try awaitPromise(promise)
        } catch {
            sdkLogger.error("\(_loggerPrefix) Error during awaiting for for createVideoTrack")
        }
        return videoTrack
    }

    public func createAudioTrack(metadata: Metadata) -> LocalAudioTrack {
        let audioSource = peerConnectionFactoryWrapper.createAudioSource(AudioUtils.audioConstraints)
        let webrtcTrack = peerConnectionFactoryWrapper.createAudioTrack(source: audioSource)
        webrtcTrack.isEnabled = true
        let audioTrack = LocalAudioTrack(
            mediaTrack: webrtcTrack, audioSource: audioSource, endpointId: localEndpoint.id, metadata: metadata)
        audioTrack.start()
        let promise = commandsQueue.addCommand(
            Command(commandName: .ADD_TRACK, clientStateAfterCommand: nil) {
                self.localEndpoint = self.localEndpoint.addOrReplaceTrack(audioTrack)
                self.peerConnectionManager.addTrack(track: audioTrack)
                if self.commandsQueue.clientState == .CONNECTED || self.commandsQueue.clientState == .JOINED {
                    self.rtcEngineCommunication.renegotiateTracks()
                } else {
                    self.commandsQueue.finishCommand(commandName: .ADD_TRACK)
                }
            })

        do {
            try awaitPromise(promise)
        } catch {

        }
        return audioTrack
    }

    public func prepareForBroadcastScreenSharing(
        appGroup: String, videoParameters: VideoParameters, metadata: Metadata,
        canStart: @escaping () -> Bool,
        onStart: @escaping () -> Void,
        onStop: @escaping () -> Void
    ) {
        let videoSource = peerConnectionFactoryWrapper.createScreenShareVideoSource()

        broadcastScreenShareReceiver = BroadcastScreenShareReceiver(
            onStart: { [weak self] in
                guard let self, let videoSource = broadcastScreenShareCapturer?.source else { return }
                guard canStart() else { return }
                let webrtcTrack = peerConnectionFactoryWrapper.createVideoTrack(source: videoSource)
                let track = LocalBroadcastScreenShareTrack(
                    mediaTrack: webrtcTrack, videoSource: videoSource, endpointId: localEndpoint.id, metadata: metadata,
                    appGroup: appGroup,
                    videoParameters: videoParameters)
                let promise = commandsQueue.addCommand(
                    Command(commandName: .ADD_TRACK, clientStateAfterCommand: nil) { [weak self] in
                        guard let self else { return }
                        localEndpoint = localEndpoint.addOrReplaceTrack(track)
                        peerConnectionManager.addTrack(track: track)
                        if commandsQueue.clientState == .CONNECTED || self.commandsQueue.clientState == .JOINED {
                            rtcEngineCommunication.renegotiateTracks()
                        } else {
                            commandsQueue.finishCommand(commandName: .ADD_TRACK)
                        }
                        onStart()
                    })
                do {
                    try awaitPromise(promise)
                    listener.onTrackAdded(track: track)
                } catch {}
            },
            onStop: { [weak self] in
                guard let self,
                    let track = localEndpoint.tracks.values.first(where: { $0 is LocalBroadcastScreenShareTrack })
                        as? LocalBroadcastScreenShareTrack
                else { return }
                removeTrack(trackId: track.id)
                listener.onTrackRemoved(track: track)
                onStop()
            })

        broadcastScreenShareCapturer = BroadcastScreenShareCapturer(
            videoSource, appGroup: appGroup, videoParameters: videoParameters)
        broadcastScreenShareCapturer?.capturerDelegate = broadcastScreenShareReceiver
        broadcastScreenShareCapturer?.startListening()
    }

    public func createAppScreenShareTrack(videoParameters: VideoParameters, metadata: Metadata)
        -> LocalAppScreenShareTrack
    {
        let videoSource = peerConnectionFactoryWrapper.createScreenShareVideoSource()
        let webrtcTrack = peerConnectionFactoryWrapper.createVideoTrack(source: videoSource)
        let videoCapturer = AppScreenShareCapturer(videoSource)
        let videoTrack = LocalAppScreenShareTrack(
            mediaTrack: webrtcTrack, videoSource: videoSource, endpointId: localEndpoint.id, metadata: metadata,
            videoParameters: videoParameters, capturer: videoCapturer)
        videoTrack.start()
        let promise = commandsQueue.addCommand(
            Command(commandName: .ADD_TRACK, clientStateAfterCommand: nil) {
                self.localEndpoint = self.localEndpoint.addOrReplaceTrack(videoTrack)
                self.peerConnectionManager.addTrack(track: videoTrack)
                if self.commandsQueue.clientState == .CONNECTED || self.commandsQueue.clientState == .JOINED {
                    self.rtcEngineCommunication.renegotiateTracks()
                } else {
                    self.commandsQueue.finishCommand(commandName: .ADD_TRACK)
                }
            })
        do {
            try awaitPromise(promise)
        } catch {
            sdkLogger.error("\(_loggerPrefix) Error during awaiting for for \(#function)")
        }
        return videoTrack
    }

    public func removeTrack(trackId: String) {
        let promise = commandsQueue.addCommand(
            Command(commandName: .REMOVE_TRACK, clientStateAfterCommand: nil) {
                guard let track = self.getTrack(trackId: trackId) else {
                    return
                }
                (track as? LocalTrack)?.stop()
                self.localEndpoint = self.localEndpoint.removeTrack(track)
                if self.commandsQueue.clientState == .CONNECTED || self.commandsQueue.clientState == .JOINED {
                    self.peerConnectionManager.removeTrack(trackId: track.webrtcId)
                    self.rtcEngineCommunication.renegotiateTracks()
                }

                self.listener.onTrackRemoved(track: track)
            })
        do {
            try awaitPromise(promise)
        } catch {}
    }

    func setTargetTrackEncoding(trackId: String, encoding: TrackEncoding) {
        if let rtcTrackId = getTrack(trackId: trackId)?.rtcEngineId {
            rtcEngineCommunication.setTargetTrackEncoding(trackId: rtcTrackId, encoding: encoding)
        } else {
            sdkLogger.error("\(_loggerPrefix) setTargetTrackEncoding: invalid track id")
        }
    }

    func enableTrackEncoding(trackId: String, encoding: TrackEncoding) {
        if let rtcTrackId = getTrack(trackId: trackId)?.webrtcId {
            peerConnectionManager.setTrackEncoding(trackId: rtcTrackId, encoding: encoding, enabled: true)
        } else {
            sdkLogger.error("\(_loggerPrefix) enableTrackEncoding: invalid track id")
        }
    }

    func disableTrackEncoding(trackId: String, encoding: TrackEncoding) {
        if let rtcTrackId = getTrack(trackId: trackId)?.webrtcId {
            peerConnectionManager.setTrackEncoding(trackId: rtcTrackId, encoding: encoding, enabled: false)
        } else {
            sdkLogger.error("\(_loggerPrefix) disableTrackEncoding: invalid track id")
        }
    }

    func updatePeerMetadata(metadata: Metadata) {
        rtcEngineCommunication.updateEndpointMetadata(metadata: metadata)
        localEndpoint = localEndpoint.copyWith(metadata: metadata)
    }

    func updateTrackMetadata(trackId: String, metadata: Metadata) {
        if let track = getTrack(trackId: trackId) {
            track.metadata = metadata
            localEndpoint = localEndpoint.addOrReplaceTrack(track)
            if let rtcEngineTrackId = track.rtcEngineId {
                rtcEngineCommunication.updateTrackMetadata(trackId: rtcEngineTrackId, trackMetadata: metadata)
            }
        } else {
            sdkLogger.error("\(_loggerPrefix) updateTrackMetadata: invalid track id")
        }
    }

    func setTrackBandwidth(trackId: String, bandwidth: BandwidthLimit) {
        if let webrtcId = getTrack(trackId: trackId)?.webrtcId {
            peerConnectionManager.setTrackBandwidth(trackId: webrtcId, bandwidth: bandwidth)
        } else {
            sdkLogger.error("\(_loggerPrefix) setTrackBandwidth: invalid track id")
        }
    }

    func setEncodingBandwidth(trackId: String, encoding: String, bandwidth: BandwidthLimit) {
        if let webrtcId = getTrack(trackId: trackId)?.webrtcId {
            peerConnectionManager.setEncodingBandwidth(trackId: webrtcId, encoding: encoding, bandwidth: bandwidth)
        } else {
            sdkLogger.error("\(_loggerPrefix) setTrackBandwidth: invalid track id")
        }
    }

    func changeWebRTCLoggingSeverity(severity: RTCLoggingSeverity) {
        RTCSetMinDebugLogLevel(severity)
    }

    var stats: [String: RTCStats] {
        return peerConnectionManager.getStats()
    }

    var remoteEndpoints: [Endpoint] {
        return remoteEndpointsMap.map { $0.value }
    }

    private func sendEvent(peerMessage: Data) {
        self.webSocket?.write(data: peerMessage)
    }

    private func receiveEvent(event: SerializedMediaEvent) {
        rtcEngineCommunication.onEvent(serializedEvent: event)
    }

    func websocketDidConnect() {
        let authRequest = Fishjam_PeerMessage.with({
            $0.authRequest = Fishjam_PeerMessage.AuthRequest.with({
                $0.token = self.config?.token ?? ""
            })
        })

        guard let serializedData = try? authRequest.serializedData() else {
            return
        }
        sendEvent(peerMessage: serializedData)
    }

    func websocketDidReceiveData(data: Data) {
        do {
            let peerMessage = try Fishjam_PeerMessage(serializedData: data)
            if case .authenticated(_) = peerMessage.content {
                isAuthenticated = true
                commandsQueue.finishCommand()
                join()
            } else if case .mediaEvent(_) = peerMessage.content {
                receiveEvent(event: peerMessage.mediaEvent.data)
            } else {
                sdkLogger.error("Received unexpected websocket message: \(peerMessage)")
            }
        } catch {
            sdkLogger.error("Unexpected error: \(error).")
        }
    }

    func websocketDidReceiveMessage(text: String) {
        sdkLogger.error("Unsupported socket callback 'websocketDidReceiveMessage' was called.")
        onSocketError()
    }

    func onSocketClose(code: UInt16, reason: String) {
        if let authError = AuthError(rawValue: reason) {
            onAuthError(reason: authError)
        }
        listener.onSocketClose(code: code, reason: reason)
    }

    func onAuthError(reason: AuthError) {
        listener.onAuthError(reason: reason)
    }

    func onSocketError() {
        isAuthenticated = false
        listener.onSocketError()
    }

    func onDisconnected() {
        isAuthenticated = false
        listener.onDisconnected()
    }

    func onConnectionError(metadata: Any) {
        listener.onJoinError(metadata: metadata)
    }

    func prepareToReconnect() {
        //TODO: should it be DispatchQueue??
        DispatchQueue.fishjam.sync {
            peerConnectionManager.close()
            webSocket?.disconnect(closeCode: CloseCode.normal.rawValue)
            webSocket = nil
            prevTracks = Array(localEndpoint.tracks.values)
            remoteEndpointsMap = [:]
            localEndpoint = localEndpoint.copyWith(id: "", tracks: [:])
        }
    }

    func recreateTracks() {
        //TODO: should it be DispatchQueue??
        DispatchQueue.fishjam.sync {
            prevTracks.forEach { track in
                switch track {
                case let track as LocalCameraTrack:
                    let webrtcTrack = peerConnectionFactoryWrapper.createVideoTrack(source: track.videoSource)
                    let videoTrack = LocalCameraTrack(mediaTrack: webrtcTrack, oldTrack: track)
                    localEndpoint = localEndpoint.addOrReplaceTrack(videoTrack)
                    break
                case let track as LocalAudioTrack:
                    let webrtcTrack = peerConnectionFactoryWrapper.createAudioTrack(source: track.audioSource)
                    let audioTrack = LocalAudioTrack(mediaTrack: webrtcTrack, oldTrack: track)
                    audioTrack.start()
                    localEndpoint = localEndpoint.addOrReplaceTrack(audioTrack)
                    break
                case let track as LocalBroadcastScreenShareTrack:
                    let webrtcTrack = peerConnectionFactoryWrapper.createVideoTrack(source: track.videoSource)
                    let videoTrack = LocalBroadcastScreenShareTrack(mediaTrack: webrtcTrack, oldTrack: track)
                    localEndpoint = localEndpoint.addOrReplaceTrack(videoTrack)
                    break
                case let track as LocalAppScreenShareTrack:
                    let webrtcTrack = peerConnectionFactoryWrapper.createVideoTrack(source: track.videoSource)
                    let videoTrack = LocalAppScreenShareTrack(mediaTrack: webrtcTrack, oldTrack: track)
                    localEndpoint = localEndpoint.addOrReplaceTrack(videoTrack)
                    break
                default:
                    break
                }

            }
            prevTracks = []

        }
    }
}

extension FishjamClientInternal: WebSocketDelegate {
    func didReceive(event: Starscream.WebSocketEvent, client: any Starscream.WebSocketClient) {
        switch event {
        case .connected(_):
            websocketDidConnect()
        case .disconnected(let reason, let code):
            onSocketClose(code: code, reason: reason)
        case .text(let message):
            websocketDidReceiveMessage(text: message)
        case .binary(let data):
            websocketDidReceiveData(data: data)
        case .ping(_):
            break
        case .pong(_):
            break
        case .reconnectSuggested(_):
            break
        ///viabilityChanged is called when there is no internet
        case .viabilityChanged(let isViable):
            if !isViable {
                onSocketError()
                commandsQueue.clear()
                prepareToReconnect()
                reconnectionManager?.onDisconnected()
            }
            break
        case .cancelled:
            onDisconnected()
            break
        case .error(_):
            onSocketError()
            commandsQueue.clear()
            prepareToReconnect()
            reconnectionManager?.onDisconnected()
            break
        default:
            break
        }
    }
}

extension FishjamClientInternal: PeerConnectionListener {
    func onAddTrack(trackId: String, webrtcTrack: RTCMediaStreamTrack) {
        guard var track = getTrackWithRtcEngineId(trackId: trackId) else {
            sdkLogger.error("Invalid rtcEngineId in onAddTrack: \(trackId)")
            return
        }
        let trackId = track.id
        let endpointId = track.endpointId
        let rtcEngineId = track.rtcEngineId
        let metadata = track.metadata
        switch webrtcTrack {
        case let videoTrack as RTCVideoTrack:
            track = RemoteVideoTrack(
                mediaTrack: videoTrack, endpointId: endpointId, rtcEngineId: rtcEngineId, metadata: metadata,
                id: trackId)

        case let audioTrack as RTCAudioTrack:
            track = RemoteAudioTrack(
                audioTrack: audioTrack, endpointId: endpointId, rtcEngineId: rtcEngineId, metadata: metadata,
                id: trackId)

        default:
            sdkLogger.error("Invalid type of incoming track")
            return
        }

        remoteEndpointsMap[endpointId] = remoteEndpointsMap[endpointId]?.addOrReplaceTrack(track)
        listener.onTrackReady(track: track)
    }

    func onLocalIceCandidate(candidate: RTCIceCandidate) {
        let splitSdp = candidate.sdp.split(separator: " ")
        guard let ufragIndex = splitSdp.firstIndex(of: "ufrag") else {
            return
        }
        let ufrag = String(splitSdp[ufragIndex + 1])
        rtcEngineCommunication.localCandidate(
            sdp: candidate.sdp, sdpMLineIndex: candidate.sdpMLineIndex, sdpMid: Int32(candidate.sdpMid ?? "0") ?? 0,
            usernameFragment: ufrag)
    }
}

extension FishjamClientInternal: RTCEngineListener {
    func onSendMediaEvent(event: SerializedMediaEvent) {
        if !isAuthenticated {
            sdkLogger.error("Tried to send media event: \(event) before authentication")
            return
        }
        let mediaEvent =
            Fishjam_PeerMessage.with({
                $0.mediaEvent = Fishjam_PeerMessage.MediaEvent.with({
                    $0.data = event
                })
            })

        guard let serialzedData = try? mediaEvent.serializedData() else {
            return
        }
        sendEvent(peerMessage: serialzedData)
    }

    func onConnected(endpointId: String, otherEndpoints: [EventEndpoint]) {
        localEndpoint = localEndpoint.copyWith(id: endpointId)
        for eventEndpoint in otherEndpoints {
            var endpoint = Endpoint(
                id: eventEndpoint.id, type: EndpointType(fromString: eventEndpoint.type),
                metadata: eventEndpoint.metadata ?? Metadata())
            for (trackId, track) in eventEndpoint.tracks {
                let track = Track(
                    mediaTrack: nil, endpointId: eventEndpoint.id, rtcEngineId: trackId, metadata: track.metadata)
                endpoint = endpoint.addOrReplaceTrack(track)
                listener.onTrackAdded(track: track)
            }
            remoteEndpointsMap[eventEndpoint.id] = endpoint
        }

        listener.onJoined(peerID: endpointId, peersInRoom: remoteEndpointsMap)
        commandsQueue.finishCommand()
        reconnectionManager?.onReconnected()
        guard !localEndpoint.tracks.isEmpty else { return }
        let promise = commandsQueue.addCommand(
            Command(commandName: .ADD_TRACK, clientStateAfterCommand: nil) {
                if self.commandsQueue.clientState == .CONNECTED || self.commandsQueue.clientState == .JOINED {
                    self.rtcEngineCommunication.renegotiateTracks()
                } else {
                    self.commandsQueue.finishCommand(commandName: .ADD_TRACK)
                }
            })
        do {
            try awaitPromise(promise)
        } catch {
            sdkLogger.error("\(_loggerPrefix) Error during awaiting for for createVideoTrack")
        }
    }

    func onEndpointAdded(endpointId: String, type: EndpointType, metadata: Metadata?) {
        if endpointId == localEndpoint.id {
            return
        }
        let endpoint = Endpoint(id: endpointId, type: type, metadata: metadata ?? Metadata())

        remoteEndpointsMap[endpoint.id] = endpoint

        listener.onPeerJoined(endpoint: endpoint)
    }

    func onEndpointRemoved(endpointId: String) {
        if endpointId == localEndpoint.id {
            listener.onDisconnected()
            return
        }
        guard let endpoint = remoteEndpointsMap.removeValue(forKey: endpointId) else {
            sdkLogger.error("Failed to process EndpointLeft event: Endpoint not found: \(endpointId)")
            return
        }

        endpoint.tracks.forEach { (_, track) in
            listener.onTrackRemoved(track: track)
        }

        listener.onPeerLeft(endpoint: endpoint)
    }

    func onEndpointUpdated(endpointId: String, metadata: Metadata?) {
        guard let endpoint = remoteEndpointsMap[endpointId] else {
            sdkLogger.error("Failed to process EndpointUpdated event: Endpoint not found: $endpointId")
            return
        }

        remoteEndpointsMap[endpoint.id] = endpoint.copyWith(metadata: metadata)

        listener.onPeerUpdated(endpoint: endpoint)
    }

    func onOfferData(integratedTurnServers: [OfferDataEvent.TurnServer], tracksTypes: [String: Int]) {
        let localTracks = localEndpoint.tracks.map { $1 }
        peerConnectionManager.getSdpOffer(
            integratedTurnServers: integratedTurnServers, tracksTypes: tracksTypes, localTracks: localTracks
        ) { sdp, midToTrackId, error in
            if let err = error {
                sdkLogger.error("Failed to create sdp offer: \(err)")
                return
            }

            if let sdp = sdp, let midToTrackId = midToTrackId {
                self.rtcEngineCommunication.sdpOffer(
                    sdp: sdp,
                    trackIdToTrackMetadata: self.localEndpoint.tracks.reduce(into: [String: Metadata]()) {
                        (result, trackEntry) in
                        let (_, trackData) = trackEntry
                        result[trackData.webrtcId] = trackData.metadata
                    },
                    midToTrackId: midToTrackId
                )
            }
        }
    }

    func onSdpAnswer(type: String, sdp: String, midToTrackId: [String: String]) {
        peerConnectionManager.onSdpAnswer(sdp: sdp, midToTrackId: midToTrackId)

        localEndpoint.tracks.values.forEach { track in
            guard !(track is LocalAudioTrack) else { return }

            var config: SimulcastConfig? = nil
            if let track = track as? LocalCameraTrack {
                config = track.videoParameters.simulcastConfig
            }

            if let track = track as? LocalBroadcastScreenShareTrack {
                config = track.videoParameters.simulcastConfig
            }

            TrackEncoding.allCases.forEach { encoding in
                if config?.activeEncodings.contains(encoding) == false {
                    peerConnectionManager.setTrackEncoding(trackId: track.webrtcId, encoding: encoding, enabled: false)
                }

            }
        }
        commandsQueue.finishCommand(commandNames: [CommandName.ADD_TRACK, CommandName.REMOVE_TRACK])
    }

    func onRemoteCandidate(candidate: String, sdpMLineIndex: Int32, sdpMid: String?) {
        let iceCandidate = RTCIceCandidate(sdp: candidate, sdpMLineIndex: sdpMLineIndex, sdpMid: sdpMid)
        peerConnectionManager.onRemoteCandidate(candidate: iceCandidate)
    }

    func onTracksAdded(endpointId: String, tracks: [String: TrackData]) {
        if localEndpoint.id == endpointId { return }

        guard let endpoint = remoteEndpointsMap[endpointId] else {
            sdkLogger.error("Failed to process TracksAdded event: Endpoint not found: \(endpointId)")
            return
        }

        var updatedTracks: [String: Track] = endpoint.tracks

        for (trackId, trackData) in tracks {
            var track = endpoint.tracks.values.first(where: { track in track.rtcEngineId == trackId })
            if track != nil {
                track!.metadata = trackData.metadata
            } else {
                track = Track(
                    mediaTrack: nil, endpointId: endpointId, rtcEngineId: trackId, metadata: trackData.metadata)
                listener.onTrackAdded(track: track!)
            }
            updatedTracks[track!.id] = track
        }

        let updatedEndpoint = endpoint.copyWith(tracks: updatedTracks)

        remoteEndpointsMap[updatedEndpoint.id] = updatedEndpoint
    }

    func onTracksRemoved(endpointId: String, trackIds: [String]) {
        if localEndpoint.id == endpointId { return }

        guard var endpoint = remoteEndpointsMap[endpointId] else {
            sdkLogger.error("Failed to process onTracksRemoved event: Endpoint not found: \(endpointId)")
            return
        }

        trackIds.forEach { trackId in
            guard let track = endpoint.tracks.values.first(where: { track in track.rtcEngineId == trackId }) else {
                return
            }

            endpoint = endpoint.removeTrack(track)
        }

        remoteEndpointsMap[endpointId] = endpoint
        listener.onPeerUpdated(endpoint: endpoint)
    }

    func onTrackUpdated(endpointId: String, trackId: String, metadata: Metadata) {
        guard let track = getTrack(trackId: trackId) else {
            sdkLogger.error("Failed to process TrackUpdated event: Track context not found: \(trackId)")
            return
        }

        track.metadata = metadata

        listener.onTrackUpdated(track: track)
    }

    func onTrackEncodingChanged(endpointId: String, trackId: String, encoding: String, encodingReason: String) {
        guard let encodingReasonEnum = EncodingReason(rawValue: encodingReason) else {
            sdkLogger.error("Invalid encoding reason in onTrackEncodingChanged: \(encodingReason)")
            return
        }

        guard let track = getTrack(trackId: trackId) as? RemoteVideoTrack else {
            sdkLogger.error("Invalid trackId in onTrackEncodingChanged: \(trackId)")
            return
        }

        guard let encodingEnum = try? TrackEncoding(encoding) else {
            sdkLogger.error("Invalid encoding in onTrackEncodingChanged: \(encoding)")
            return
        }

        track.setEncoding(encoding: encodingEnum, encodingReason: encodingReasonEnum)
    }

    func onVadNotification(trackId: String, status: String) {
        guard let track = getTrack(trackId: trackId) else {
            sdkLogger.error("Invalid trackId in onVadNotification: \(trackId)")
            return
        }

        guard let vadStatus = VadStatus(rawValue: status) else {
            sdkLogger.error("Invalid vad status in onVadNotification: \(status)")
            return
        }

        (track as? RemoteAudioTrack)?.vadStatus = vadStatus
    }

    func onBandwidthEstimation(estimation: Int) {
        listener.onBandwidthEstimationChanged(estimation: estimation)
    }
}
