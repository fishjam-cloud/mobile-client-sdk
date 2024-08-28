import Foundation
import Promises
import Starscream
import WebRTC

internal class FishjamClientInternal: WebSocketDelegate, PeerConnectionListener, RTCEngineListener {
    private var config: ConnectionConfig?
    private let commandsQueue: CommandsQueue = CommandsQueue()
    private var webSocket: FishjamWebsocket?
    private var listener: FishjamClientListener
    private var websocketFactory: (String) -> FishjamWebsocket
    private var peerConnectionManager: PeerConnectionManager
    private var peerConnectionFactoryWrapper: PeerConnectionFactoryWrapper
    private var rtcEngineCommunication: RTCEngineCommunication
    private var isAuthenticated = false
    private var broadcastScreenshareReceiver: ScreenBroadcastNotificationReceiver?

    private var _loggerPrefix = "FishjamClientInternal"

    private(set) var localEndpoint: Endpoint = Endpoint(id: "", type: .WEBRTC)
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

    func connect(config: ConnectionConfig) {
        self.config = config
        peerConnectionManager.addListener(self)
        rtcEngineCommunication.addListener(self)

        commandsQueue.addCommand(
            Command(commandName: .CONNECT, clientStateAfterCommand: .CONNECTED) {
                self.webSocket = self.websocketFactory(config.websocketUrl)
                self.webSocket?.delegate = self
                self.webSocket?.connect()
            }
        )
    }

    func join(peerMetadata: Metadata = Metadata()) {
        commandsQueue.addCommand(
            Command(commandName: .JOIN, clientStateAfterCommand: .JOINED) {
                self.localEndpoint = self.localEndpoint.copyWith(metadata: peerMetadata)
                self.rtcEngineCommunication.connect(metadata: peerMetadata)
            })
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
    }

    func leave() {
        rtcEngineCommunication.disconnect()
        for track in localEndpoint.tracks.values {
            if track is LocalTrack {
                (track as! LocalTrack).stop()
            }
        }
        peerConnectionManager.close()
        localEndpoint = Endpoint(id: "", type: .WEBRTC)
        remoteEndpointsMap = [:]
        peerConnectionManager.removeListener(self)
        rtcEngineCommunication.removeListener(self)
        webSocket?.disconnect()
        webSocket = nil
        commandsQueue.clear()
    }

    func createVideoTrack(videoParameters: VideoParameters, metadata: Metadata, captureDeviceName: String? = nil)
        -> LocalVideoTrack
    {
        let videoSource = peerConnectionFactoryWrapper.createVideoSource()
        let webrtcTrack = peerConnectionFactoryWrapper.createVideoTrack(source: videoSource)
        let videoCapturer = CameraCapturer(
            videoParameters: videoParameters, delegate: videoSource, deviceId: captureDeviceName)
        let videoTrack = LocalVideoTrack(
            mediaTrack: webrtcTrack, endpointId: localEndpoint.id, videoParameters: videoParameters,
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

        }
        return videoTrack
    }

    public func createAudioTrack(metadata: Metadata) -> LocalAudioTrack {
        let audioSource = peerConnectionFactoryWrapper.createAudioSource(AudioUtils.audioConstraints)
        let webrtcTrack = peerConnectionFactoryWrapper.createAudioTrack(source: audioSource)
        webrtcTrack.isEnabled = true
        let audioTrack = LocalAudioTrack(mediaTrack: webrtcTrack, endpointId: localEndpoint.id, metadata: metadata)
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

    public func createScreencastTrack(
        appGroup: String, videoParameters: VideoParameters, metadata: Metadata,
        onStart: @escaping (_ track: LocalScreencastTrack) -> Void,
        onStop: @escaping (_ track: LocalScreencastTrack) -> Void
    ) -> LocalScreencastTrack {
        let videoSource = peerConnectionFactoryWrapper.createScreencastVideoSource()
        let webrtcTrack = peerConnectionFactoryWrapper.createVideoTrack(source: videoSource)

        let track = LocalScreencastTrack(
            mediaTrack: webrtcTrack, mediaSource: videoSource, endpointId: localEndpoint.id, appGroup: appGroup,
            videoParameters: videoParameters)

        broadcastScreenshareReceiver = ScreenBroadcastNotificationReceiver(
            onStart: { [weak self, weak track] in
                guard let track = track else {
                    return
                }
                let promise = self?.commandsQueue.addCommand(
                    Command(commandName: .ADD_TRACK, clientStateAfterCommand: nil) {
                        if self?.localEndpoint != nil {
                            self!.localEndpoint = self!.localEndpoint.addOrReplaceTrack(track)
                            self!.peerConnectionManager.addTrack(track: track)
                            self!.rtcEngineCommunication.renegotiateTracks()
                            onStart(track)
                        }
                    })
                do {
                    if let promise = promise {
                        try awaitPromise(promise)
                    }
                } catch {

                }
            },
            onStop: { [weak self, weak track] in
                guard let track = track else {
                    return
                }
                self?.removeTrack(trackId: track.id)
                onStop(track)
            })

        let simulcastConfig = videoParameters.simulcastConfig

        track.delegate = broadcastScreenshareReceiver
        track.start()

        return track

    }

    public func removeTrack(trackId: String) {
        let promise = commandsQueue.addCommand(
            Command(commandName: .REMOVE_TRACK, clientStateAfterCommand: nil) {
                guard let track = self.getTrack(trackId: trackId) else {
                    return
                }
                (track as? LocalTrack)?.stop()
                self.localEndpoint = self.localEndpoint.removeTrack(track)
                self.peerConnectionManager.removeTrack(trackId: track.webrtcId)
                self.rtcEngineCommunication.renegotiateTracks()

            })

        do {
            try awaitPromise(promise)
        } catch {

        }
    }

    func onSdpAnswer(type: String, sdp: String, midToTrackId: [String: String?]) {
        peerConnectionManager.onSdpAnswer(sdp: sdp, midToTrackId: midToTrackId)

        localEndpoint.tracks.values.forEach { track in
            guard !(track is LocalAudioTrack) else { return }

            var config: SimulcastConfig? = nil
            if track is LocalVideoTrack {
                config = (track as! LocalVideoTrack).videoParameters.simulcastConfig
            }

            if track is LocalScreencastTrack {
                config = (track as! LocalScreencastTrack).videoParameters.simulcastConfig
            }

            TrackEncoding.allCases.forEach { encoding in
                if config?.activeEncodings.contains(encoding) == false {
                    peerConnectionManager.setTrackEncoding(trackId: track.webrtcId, encoding: encoding, enabled: false)
                }

            }
        }
        commandsQueue.finishCommand(commandNames: [CommandName.ADD_TRACK, CommandName.REMOVE_TRACK])
    }

    func setTargetTrackEncoding(trackId: String, encoding: TrackEncoding) {
        if let rtcTrackId = getTrack(trackId: trackId)?.rtcEngineId {
            rtcEngineCommunication.setTargetTrackEncoding(trackId: rtcTrackId, encoding: encoding)
        } else {
            sdkLogger.error("\(_loggerPrefix) setTargetTrackEncoding: invalid track id")
        }
    }

    func enableTrackEncoding(trackId: String, encoding: TrackEncoding) {
        if let rtcTrackId = getTrack(trackId: trackId)?.rtcEngineId {
            peerConnectionManager.setTrackEncoding(trackId: rtcTrackId, encoding: encoding, enabled: true)
        } else {
            sdkLogger.error("\(_loggerPrefix) enableTrackEncoding: invalid track id")
        }
    }

    func disableTrackEncoding(trackId: String, encoding: TrackEncoding) {
        if let rtcTrackId = getTrack(trackId: trackId)?.rtcEngineId {
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

    func onSendMediaEvent(event: SerializedMediaEvent) {
        if !isAuthenticated {
            print("Tried to send media event: \(event) before authentication")
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
        guard let endpoint = remoteEndpointsMap.removeValue(forKey: endpointId) else {
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
                    trackIdToTrackMetadata: self.localEndpoint.tracks.mapValues({ trackData in
                        trackData.metadata
                    }),
                    midToTrackId: midToTrackId
                )
            }
        }
    }

    func onRemoteCandidate(candidate: String, sdpMLineIndex: Int32, sdpMid: String?) {
        let iceCandidate = RTCIceCandidate(sdp: candidate, sdpMLineIndex: sdpMLineIndex, sdpMid: sdpMid)
        peerConnectionManager.onRemoteCandidate(candidate: iceCandidate)
    }

    func onTracksAdded(endpointId: String, tracks: [String: TrackData]) {
        if localEndpoint.id == endpointId { return }

        guard let endpoint = remoteEndpointsMap.removeValue(forKey: endpointId) else {
            sdkLogger.error("Failed to process TracksAdded event: Endpoint not found: \(endpointId)")
            return
        }

        var updatedTracks = [String: Track]()

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

        guard var endpoint = remoteEndpointsMap.removeValue(forKey: endpointId) else {
            sdkLogger.error("Failed to process onTracksRemoved event: Endpoint not found: \(endpointId)")
            return
        }

        trackIds.forEach { trackId in
            guard let track = endpoint.tracks[trackId] else {
                return
            }

            endpoint = endpoint.removeTrack(track)

            listener.onTrackReady(track: track)
        }

        remoteEndpointsMap[endpointId] = endpoint
    }

    func onTrackUpdated(endpointId: String, trackId: String, metadata: Metadata) {
        guard var track = getTrack(trackId: trackId) else {
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

        guard let track = getTrack(trackId: trackId) else {
            sdkLogger.error("Invalid trackId in onTrackEncodingChanged: \(trackId)")
            return
        }

        guard let encodingEnum = try? TrackEncoding.fromString(encoding) else {
            sdkLogger.error("Invalid encoding in onTrackEncodingChanged: \(encoding)")
            return
        }

        (track as? RemoteVideoTrack)?.setEncoding(encoding: encodingEnum, encodingReason: encodingReasonEnum)
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
        rtcEngineCommunication.localCandidate(sdp: candidate.sdp, sdpMLineIndex: candidate.sdpMLineIndex)

    }

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
        case .viabilityChanged(_):
            break
        case .reconnectSuggested(_):
            break
        case .cancelled:
            onDisconnected()
        case .error(_):
            onSocketError()
        default:
            break
        }
    }

    func websocketDidConnect() {
        onSocketOpen()
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
                onAuthSuccess()
                commandsQueue.finishCommand()
            } else if case .mediaEvent(_) = peerMessage.content {
                receiveEvent(event: peerMessage.mediaEvent.data)
            } else {
                print("Received unexpected websocket message: \(peerMessage)")
            }
        } catch {
            print("Unexpected error: \(error).")
        }
    }

    func websocketDidReceiveMessage(text: String) {
        print("Unsupported socket callback 'websocketDidReceiveMessage' was called.")
        onSocketError()
    }

    func onSocketClose(code: UInt16, reason: String) {
        listener.onSocketClose(code: code, reason: reason)
    }

    func onSocketError() {
        isAuthenticated = false
        listener.onSocketError()
    }

    func onSocketOpen() {
        listener.onSocketOpen()
    }

    func onAuthSuccess() {
        listener.onAuthSuccess()
    }

    func onAuthError() {
        listener.onAuthError()
    }

    func onDisconnected() {
        isAuthenticated = false
        listener.onDisconnected()
    }

    func onConnectionError(metadata: Any) {
        listener.onJoinError(metadata: metadata)
    }
}
