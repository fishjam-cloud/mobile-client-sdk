import Foundation
import Starscream
import WebRTC


internal class FishjamClientInternal: WebSocketDelegate, PeerConnectionListener, RTCEngineListener {
    private var config: Config?
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
    private var remoteEndpoints: [String: Endpoint] = [:]

    public init(
        listener: FishjamClientListener, peerConnectionManager: PeerConnectionManager, peerConnectionFactoryWrapper: PeerConnectionFactoryWrapper,
        rtcEngineCommunication: RTCEngineCommunication, websocketFactory: @escaping (String) -> FishjamWebsocket
    ) {
        self.listener = listener
        self.websocketFactory = websocketFactory
        self.peerConnectionManager = peerConnectionManager
        self.rtcEngineCommunication = rtcEngineCommunication
        self.peerConnectionFactoryWrapper = peerConnectionFactoryWrapper
    }

    private func getTrack(trackId: String) -> Track? {
        if let track = localEndpoint.tracks[trackId] {
            return track
        }
        for endpoint in remoteEndpoints.values {
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
        for endpoint in remoteEndpoints.values {
            if let track = endpoint.tracks.values.first(where: { $0.rtcEngineId == trackId }) {
                return track
            }
        }

        return nil
    }

    func connect(config: Config) {
        self.config = config
        peerConnectionManager.addListener(self)
        rtcEngineCommunication.addListener(self)

        commandsQueue.addCommand(Command(commandName: .CONNECT,clientStateAfterCommand:  .CONNECTED) {
            self.webSocket = self.websocketFactory(config.websocketUrl)
            self.webSocket?.delegate = self
            self.webSocket?.connect()
          }
        )
    }

    func join(peerMetadata: Metadata = Metadata()) {
        commandsQueue.addCommand(Command(commandName: .JOIN, clientStateAfterCommand: .JOINED){
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
            remoteEndpoints[eventEndpoint.id] = endpoint
        }

        listener.onJoined(peerID: endpointId, peersInRoom: remoteEndpoints)
        commandsQueue.finishCommand()
    }

    func leave() {
        rtcEngineCommunication.disconnect()
        for track in localEndpoint.tracks.values{
            if track is LocalTrack {
                (track as! LocalTrack).stop()
            }
        }
        peerConnectionManager.close()
        localEndpoint = Endpoint(id: "", type: .WEBRTC)
        remoteEndpoints = [:]
        peerConnectionManager.removeListener(self)
        rtcEngineCommunication.removeListener(self)
        webSocket?.disconnect()
        webSocket = nil
        commandsQueue.clear()
    }
    
    func createVideoTrack(videoParameters: VideoParameters, metadata: Metadata, captureDeviceName: String? = nil) async -> LocalVideoTrack {
        let videoSource = peerConnectionFactoryWrapper.createVideoSource()
        let webrtcTrack = peerConnectionFactoryWrapper.createVideoTrack(source: videoSource)
        let videoCapturer = CameraCapturer(videoParameters: videoParameters, delegate: videoSource, deviceId: captureDeviceName)
        let videoTrack = LocalVideoTrack(mediaTrack: webrtcTrack, endpointId: localEndpoint.id, videoParameters: videoParameters, capturer: videoCapturer)
        videoTrack.start()
        let workItem = commandsQueue.addCommand(Command(commandName: .ADD_TRACK, clientStateAfterCommand: nil) {
            self.localEndpoint = self.localEndpoint.addOrReplaceTrack(videoTrack)
            self.peerConnectionManager.addTrack(track: videoTrack)
            if (self.commandsQueue.clientState == .CONNECTED || self.commandsQueue.clientState == .JOINED) {
                self.rtcEngineCommunication.renegotiateTracks()
            } else {
                self.commandsQueue.finishCommand(commandName: .ADD_TRACK)
            }
        })
        
        workItem.wait()
        return videoTrack
    }
    
    public func createAudioTrack(metadata: Metadata) -> LocalAudioTrack {
        let audioSource = peerConnectionFactoryWrapper.createAudioSource(AudioUtils.audioConstraints)
        let webrtcTrack = peerConnectionFactoryWrapper.createAudioTrack(source: audioSource)
        webrtcTrack.isEnabled = true
        let audioTrack = LocalAudioTrack(mediaTrack: webrtcTrack, endpointId: localEndpoint.id, metadata: metadata)
        audioTrack.start()
        let workItem = commandsQueue.addCommand(Command(commandName: .ADD_TRACK, clientStateAfterCommand: nil) {
            self.localEndpoint = self.localEndpoint.addOrReplaceTrack(audioTrack)
            self.peerConnectionManager.addTrack(track: audioTrack)
            if (self.commandsQueue.clientState == .CONNECTED || self.commandsQueue.clientState == .JOINED) {
                self.rtcEngineCommunication.renegotiateTracks()
            } else {
                self.commandsQueue.finishCommand(commandName: .ADD_TRACK)
            }
        })
                                                
        workItem.wait()
        return audioTrack
    }
    
    
    public func createScreencastTrack(
        appGroup: String, videoParameters: VideoParameters, metadata: Metadata,
        onStart: @escaping (_ track: LocalScreenBroadcastTrack) -> Void, onStop: @escaping () -> Void
    ) -> LocalScreenBroadcastTrack {
        let videoSource = peerConnectionFactoryWrapper.createScreencastVideoSource()
        let webrtcTrack = peerConnectionFactoryWrapper.createVideoTrack(source: videoSource)
        
        let track = LocalScreenBroadcastTrack(mediaTrack: webrtcTrack, mediaSource: videoSource, endpointId: localEndpoint.id, appGroup: appGroup, videoParameters: videoParameters)

        broadcastScreenshareReceiver = ScreenBroadcastNotificationReceiver(
            onStart: { [weak self, weak track] in
                guard let track = track else {
                    return
                }
                let workItem = self?.commandsQueue.addCommand(Command(commandName: .ADD_TRACK, clientStateAfterCommand: nil){
                    if  self?.localEndpoint != nil{
                        self!.localEndpoint = self!.localEndpoint.addOrReplaceTrack(track)
                        self!.peerConnectionManager.addTrack(track: track)
                        self!.rtcEngineCommunication.renegotiateTracks()
                        onStart(track)
                    }
                })
                workItem?.wait()
            },
            onStop: { [weak self, weak track] in
                guard let track = track else{
                    return
                }
                self?.removeTrack(trackId: track.id)
                onStop()
            })
        
        let simulcastConfig = videoParameters.simulcastConfig

        track.delegate = broadcastScreenshareReceiver
        track.start()
        
        return track
        
    }
    
    public func removeTrack(trackId: String) {
        let workItem = commandsQueue.addCommand(Command(commandName: .REMOVE_TRACK, clientStateAfterCommand: nil){
            guard let track = self.getTrack(trackId: trackId) else{
                return
            }
            (track as? LocalTrack)?.stop()
            self.localEndpoint = self.localEndpoint.removeTrack(track)
            self.peerConnectionManager.removeTrack(trackId: track.webrtcId)
            self.rtcEngineCommunication.renegotiateTracks()
        
        })
        
        workItem.wait()
    }
    
    
    func onSdpAnswer(type: String, sdp: String, midToTrackId: [String: String?]){
        peerConnectionManager.onSdpAnswer(sdp: sdp, midToTrackId: midToTrackId)
        
        localEndpoint.tracks.values.forEach{ track in
            guard !(track is LocalAudioTrack) else{ return }
            
            var config: SimulcastConfig? = nil
            if track is LocalVideoTrack{
                config = (track as! LocalVideoTrack).videoParameters.simulcastConfig
            }
            
            if track is LocalScreenBroadcastTrack{
                config = (track as! LocalScreenBroadcastTrack).videoParameters.simulcastConfig
            }
            
            TrackEncoding.allCases.forEach{ encoding in
                if(config?.activeEncodings.contains(encoding) == false){
                    peerConnectionManager.setTrackEncoding(trackId: track.webrtcId, encoding: encoding, enabled: false)
                }
                
            }
        }
        commandsQueue.finishCommand(commandNames: [CommandName.ADD_TRACK, CommandName.REMOVE_TRACK])
    }
    
    func setTargetTrackEncoding(trackId: String, encoding: TrackEncoding){
        if let rtcTrackId = getTrack(trackId: trackId)?.rtcEngineId{
            rtcEngineCommunication.setTargetTrackEncoding(trackId: rtcTrackId, encoding: encoding)
        }else{
            sdkLogger.error("\(_loggerPrefix) setTargetTrackEncoding: invalid track id")
        }
    }
    
    func enableTrackEncoding(trackId: String, encoding: TrackEncoding){
        if let rtcTrackId = getTrack(trackId: trackId)?.rtcEngineId{
            peerConnectionManager.setTrackEncoding(trackId: rtcTrackId, encoding: encoding, enabled: true)
        }else{
            sdkLogger.error("\(_loggerPrefix) enableTrackEncoding: invalid track id")
        }
    }
    
    func disableTrackEncoding(trackId: String, encoding: TrackEncoding){
        if let rtcTrackId = getTrack(trackId: trackId)?.rtcEngineId{
            peerConnectionManager.setTrackEncoding(trackId: rtcTrackId, encoding: encoding, enabled: false)
        }else{
            sdkLogger.error("\(_loggerPrefix) disableTrackEncoding: invalid track id")
        }
    }
    
    func updatePeerMetadata(metadata: Metadata){
        rtcEngineCommunication.updateEndpointMetadata(metadata: metadata)
        localEndpoint = localEndpoint.copyWith(metadata: metadata)
    }
    
    func updateTrackMetadata(trackId: String, metadata: Metadata){
        if let track = getTrack(trackId: trackId){
            track.metadata = metadata
            localEndpoint = localEndpoint.addOrReplaceTrack(track)
            if let rtcEngineTrackId = track.rtcEngineId {
                rtcEngineCommunication.updateTrackMetadata(trackId: rtcEngineTrackId, trackMetadata: metadata)
            }
        }else{
            sdkLogger.error("\(_loggerPrefix) updateTrackMetadata: invalid track id")
        }
    }
    
    func setTrackBandwidth(trackId: String, bandwidth: BandwidthLimit) {
        if let webrtcId = getTrack(trackId: trackId)?.webrtcId{
            peerConnectionManager.setTrackBandwidth(trackId: webrtcId, bandwidth: bandwidth)
        }else{
            sdkLogger.error("\(_loggerPrefix) setTrackBandwidth: invalid track id")
        }
    }
    
    func setEncodingBandwidth(trackId: String, encoding: String, bandwidth: BandwidthLimit) {
        if let webrtcId = getTrack(trackId: trackId)?.webrtcId{
            peerConnectionManager.setEncodingBandwidth(trackId: webrtcId, encoding: encoding, bandwidth: bandwidth)
        }else{
            sdkLogger.error("\(_loggerPrefix) setTrackBandwidth: invalid track id")
        }
    }
    
    func changeWebRTCLoggingSeverity(severity: RTCLoggingSeverity) {
        RTCSetMinDebugLogLevel(severity)
    }
    
    var stats: [String: RTCStats]{
        get{
            return peerConnectionManager.getStats()
        }
    }
    
    var remotePeers: [Endpoint]{
        get{
            return remoteEndpoints.map{ $0.value }
        }
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

    private func sendEvent(peerMessage: Data) {
        self.webSocket?.write(data: peerMessage)
    }

    private func receiveEvent(event: SerializedMediaEvent) {
        webrtcClient?.receiveMediaEvent(mediaEvent: event)
    }

    func onEndpointAdded(endpoint: Endpoint) {
        listener.onPeerJoined(endpoint: endpoint)
    }

    func onEndpointRemoved(endpoint: Endpoint) {
        listener.onPeerLeft(endpoint: endpoint)
    }

    func onEndpointUpdated(endpoint: Endpoint) {
        listener.onPeerUpdated(endpoint: endpoint)
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

    func onTrackAdded(ctx: TrackContext) {
        listener.onTrackAdded(ctx: ctx)
    }

    func onTrackReady(ctx: TrackContext) {
        listener.onTrackReady(ctx: ctx)
    }

    func onTrackRemoved(ctx: TrackContext) {
        listener.onTrackRemoved(ctx: ctx)
    }

    func onTrackUpdated(ctx: TrackContext) {
        listener.onTrackUpdated(ctx: ctx)
    }

    func onBandwidthEstimationChanged(estimation: Int) {
        listener.onBandwidthEstimationChanged(estimation: estimation)
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

    func onTrackEncodingChanged(endpointId: String, trackId: String, encoding: String) {
    }

    func onAddTrack(trackId: String, track: RTCMediaStreamTrack) {

    }

    func onLocalIceCandidate(candidate: RTCIceCandidate) {

    }

    func onPeerConnectionStateChange(newState: RTCIceConnectionState) {

    }
}
