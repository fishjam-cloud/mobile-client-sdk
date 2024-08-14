import Foundation
import Logging
import WebRTC

internal var sdkLogger = Logger(label: "org.membrane.ios")
internal let pcLogPrefix = "[PeerConnection]"

/// MembraneRTC client.
///
/// The client is responsible for relaying MembraneRTC Engine specific messages through given reliable transport layer.
/// Once initialized, the client is responsbile for exchaning necessary messages via provided `EventTransport` and managing underlying
/// `RTCPeerConnection`. The goal of the client is to be as lean as possible, meaning that all activies regarding the session such as moderating
/// should be implemented by the user himself on top of the `MembraneRTC`.
///
/// The user's ability of interacting with the client is greatly liimited to the essential actions such as joining/leaving the session,
/// adding/removing local tracks and receiving information about remote peers and their tracks that can be played by the user.
///
/// User can request 3 different types of local tracks that will get forwareded to the server by the client:
/// - `LocalAudioTrack` - an audio track utilizing device's microphone
/// - `LocalVideoTrack` - a video track that can utilize device's camera or if necessay use video playback from a file (useful for testing with a simulator)
/// - `LocalBroadcastScreenTrack` - a screencast track taking advantage of `Broadcast Upload Extension` to record device's screen even if the app is minimized
///
/// It is recommended to request necessary audio and video tracks before joining the room but it does not mean it can't be done afterwards (in case of screencast)
///
/// Once the user created the MembraneRTC client and connected to the server transport layer they can call the `connect` method to initialize joining the session.
/// After receiving `onConnected` a user will receive notification about various peers joining/leaving the session, new tracks being published and ready for playback
/// or going inactive.
public class MembraneRTC: MulticastDelegate<MembraneRTCDelegate>, ObservableObject, RTCEngineListener,
    PeerConnectionListener
{
    enum State {
        case awaitingConnect
        case connected
        case disconnected
    }

    public struct CreateOptions {
        let encoder: Encoder

        public init(encoder: Encoder = Encoder.DEFAULT) {
            self.encoder = encoder
        }
    }

    var state: State

    private lazy var engineCommunication: RTCEngineCommunication = {
        return RTCEngineCommunication(engineListener: self)
    }()

    // a common stream ID used for all non-screenshare and audio tracks
    private let localStreamId = UUID().uuidString

    // `RTCPeerConnection` config
    private var config: RTCConfiguration

    private var peerConnectionFactoryWrapper: PeerConnectionFactoryWrapper

    private var localTracks: [LocalTrack] = []

    private var prevLocalTracks: [LocalTrack] = []

    private var localEndpoint = Endpoint(id: "", type: "webrtc", metadata: .init([:]), tracks: [:])

    // mapping from peer's id to itself
    private var remoteEndpoints: [String: Endpoint] = [:]

    // mapping from remote track's id to its context
    private var trackContexts: [String: TrackContext] = [:]

    // receiver used for iOS screen broadcast
    private var broadcastScreenshareReceiver: ScreenBroadcastNotificationReceiver?

    private var encoder: Encoder

    private lazy var peerConnectionManager: PeerConnectionManager = {
        return PeerConnectionManager(
            config: self.config, peerConnectionFactory: self.peerConnectionFactoryWrapper, peerConnectionListener: self)
    }()

    internal init(config: RTCConfiguration, encoder: Encoder) {
        sdkLogger.logLevel = .info

        state = .awaitingConnect

        self.config = config

        peerConnectionFactoryWrapper = PeerConnectionFactoryWrapper(encoder: encoder)

        self.encoder = encoder

        super.init()
    }

    /**
     Initializes MembraneRTC client.

     Should not be confused with joining the actual room, which is a separate process.

     - Parameters:
        - with: Create options, consists of `encoder` type
        - delegate: The delegate that will receive all notification emitted by `MembraneRTC` client

     -  Returns: `MembraneRTC` client instance
     */
    public static func create(with options: CreateOptions = CreateOptions(), delegate: MembraneRTCDelegate)
        -> MembraneRTC
    {
        DispatchQueue.webRTC.sync {
            let client = MembraneRTC(config: RTCConfiguration(), encoder: options.encoder)

            client.add(delegate: delegate)

            return client
        }
    }

    // Default ICE server when no turn servers are specified
    private static func defaultIceServer() -> RTCIceServer {
        let iceUrl = "stun:stun.l.google.com:19302"

        return RTCIceServer(urlStrings: [iceUrl])
    }

    /// Initiaites join process once the client has successfully connected.
    ///
    /// Once completed either `onConnected` or `onConnectError` of client's delegate gets invovked.
    public func connect(metadata: Metadata) {
        DispatchQueue.webRTC.sync {
            guard state == .awaitingConnect else {
                return
            }

            localEndpoint = localEndpoint.with(metadata: metadata)

            engineCommunication.connect(metadata: metadata)
        }
    }

    /// Disconnects from the `Membrane RTC Engine` transport and closes the exisitng `RTCPeerConnection`
    ///
    /// Once the `disconnect` gets invoked the client can't be reused and user should create a new client instance instead.
    public func disconnect() {
        DispatchQueue.webRTC.sync {
            localTracks.forEach { track in
                track.stop()
            }

            peerConnectionManager.close()
        }
    }

    /**
   * Feeds media event received from RTC Engine to MembraneWebRTC.
   * This function should be called whenever some media event from RTC Engine
   * was received and can result in MembraneWebRTC generating some other
   * media events.
   * @param mediaEvent - String data received over custom signalling layer.
   */
    public func receiveMediaEvent(mediaEvent: SerializedMediaEvent) {
        DispatchQueue.webRTC.sync {
            engineCommunication.onEvent(serializedEvent: mediaEvent)
        }
    }

    /**
   Creates a new video track utilizing device's specified camera.

   The client assumes that app user already granted camera access permissions.

   - Parameters:
   - videoParameters: The parameters used for choosing the proper camera resolution, target framerate, bitrate and simulcast config
   - metadata: The metadata that will be sent to the `Membrane RTC Engine` for media negotiation
   - captureDeviceId: name of the chosen camera. Obtain devices using `LocalVideoTrack.getCaptureDevices` and an id using `uniqueID` property

   - Returns: `LocalCameraVideoTrack` instance that user then can use for things such as front / back camera switch.
   */
    public func createVideoTrack(
        videoParameters: VideoParameters, metadata: Metadata, captureDeviceId: String? = nil,
        simulcastConfig: SimulcastConfig? = nil
    )
        -> LocalVideoTrack
    {
        DispatchQueue.webRTC.sync {
            let videoTrack = LocalVideoTrack.create(
                for: .camera, videoParameters: videoParameters,
                peerConnectionFactoryWrapper: peerConnectionFactoryWrapper)

            peerConnectionManager.addTrack(track: videoTrack, localStreamId: localStreamId)

            if let captureDeviceId = captureDeviceId, let videoTrack = videoTrack as? LocalCameraVideoTrack {
                videoTrack.switchCamera(deviceId: captureDeviceId)
            }

            videoTrack.start()

            localTracks.append(videoTrack)

            localEndpoint = localEndpoint.withTrack(
                trackId: videoTrack.rtcTrack().trackId, metadata: metadata, simulcastConfig: simulcastConfig)

            engineCommunication.renegotiateTracks()

            return videoTrack
        }
    }

    /**
     Creates a new audio track utilizing device's microphone.

     The client assumes that app user already granted microphone access permissions.

     - Parameters:
        - metadata: The metadata that will be sent to the `Membrane RTC Engine` for media negotiation

     - Returns: `LocalAudioTrack` instance that user then can use for things such as front / back camera switch.
     */
    public func createAudioTrack(metadata: Metadata) -> LocalAudioTrack {
        DispatchQueue.webRTC.sync {
            let audioTrack = LocalAudioTrack(peerConnectionFactoryWrapper: peerConnectionFactoryWrapper)

            peerConnectionManager.addTrack(track: audioTrack, localStreamId: localStreamId)

            audioTrack.start()

            localTracks.append(audioTrack)

            localEndpoint = localEndpoint.withTrack(
                trackId: audioTrack.rtcTrack().trackId, metadata: metadata, simulcastConfig: nil)

            engineCommunication.renegotiateTracks()

            return audioTrack
        }
    }

    /**
     Creates a screencast track capturing the entire device's screen.

     The track starts listening for a media sent from a custom  `Broadcast Upload Extension`.  For more information
     please refer to `LocalBroadcastScreenTrack` for more information.

     The nature of upload extension is asynchronous due to the way that iOS handle broadcasting the screen. The app user
     may be hanging on start broadcast screen therefore there is no consistent synchronous way of telling if the broadcast started.

     - Parameters:
        - appGroup: The App Group identifier shared by the application  with a target `Broadcast Upload Extension`
        - videoParameters: The parameters used for limiting the screen capture resolution and target framerate, bitrate and simulcast config
        - metadata: The metadata that will be sent to the `Membrane RTC Engine` for media negotiation
        - onStart: The callback that will receive the screencast track called once the track becomes available
        - onStop: The callback that will be called once the track becomes unavailable
     */
    public func createScreencastTrack(
        appGroup: String, videoParameters: VideoParameters, metadata: Metadata,
        onStart: @escaping (_ track: LocalScreenBroadcastTrack) -> Void, onStop: @escaping () -> Void
    ) -> LocalScreenBroadcastTrack {
        DispatchQueue.webRTC.sync {
            let screensharingTrack = LocalScreenBroadcastTrack(
                appGroup: appGroup, videoParameters: videoParameters,
                peerConnectionFactoryWrapper: peerConnectionFactoryWrapper)
            localTracks.append(screensharingTrack)
            let simulcastConfig = videoParameters.simulcastConfig

            broadcastScreenshareReceiver = ScreenBroadcastNotificationReceiver(
                onStart: { [weak self, weak screensharingTrack] in
                    guard let track = screensharingTrack else {
                        return
                    }

                    DispatchQueue.main.async {
                        self?.setupScreencastTrack(track: track, metadata: metadata, simulcastConfig: simulcastConfig)
                        onStart(track)
                    }
                },
                onStop: { [weak self, weak screensharingTrack] in
                    DispatchQueue.main.async {
                        if let track = screensharingTrack {
                            self?.removeTrack(trackId: track.rtcTrack().trackId)
                        }
                        onStop()
                    }
                })

            screensharingTrack.delegate = broadcastScreenshareReceiver
            screensharingTrack.start()
            return screensharingTrack
        }
    }

    /**
     Removes a local track with given `trackId`.

     - Parameters:
        - trackId: The id of the local track that should get stopped and removed from the client

     - Returns: Bool whether the track has been found and removed or not
     */
    @discardableResult
    public func removeTrack(trackId: String) -> Bool {
        DispatchQueue.webRTC.sync {
            guard let index = localTracks.firstIndex(where: { $0.rtcTrack().trackId == trackId }) else {
                return false
            }

            let track = localTracks.remove(at: index)
            track.stop()

            peerConnectionManager.removeTrack(trackId: trackId)

            localEndpoint = localEndpoint.withoutTrack(trackId: trackId)

            engineCommunication.renegotiateTracks()

            return true
        }
    }

    /// Returns information about the current local endpoint
    public func currentEndpoint() -> Endpoint {
        DispatchQueue.webRTC.sync {
            return localEndpoint
        }
    }

    /**
     * Enables track encoding so that it will be sent to the server.

        - Parameters:
           - trackId: an id of a local track
           - encoding: an encoding that will be enabled
     */
    public func enableTrackEncoding(trackId: String, encoding: TrackEncoding) {
        DispatchQueue.webRTC.sync {
            setTrackEncoding(trackId: trackId, encoding: encoding, enabled: true)
        }
    }

    /**
     * Disables track encoding so that it will be no longer sent to the server.

         - Parameters:
            - trackId: an id of a local track
            - encoding: an encoding that will be disabled
     */
    public func disableTrackEncoding(trackId: String, encoding: TrackEncoding) {
        DispatchQueue.webRTC.sync {
            setTrackEncoding(trackId: trackId, encoding: encoding, enabled: false)
        }
    }

    /**
     Updates the metadata for the current endpoint.

        - Parameters:
         - metadata: Data about this endpoint that other endpoints will receive upon being added.

     If the metadata is different from what is already tracked in the room, the optional
     callback `onEndpointUpdated` will be triggered for other peers in the room.
     */
    public func updatePeerMetadata(metadata: Metadata) {
        DispatchQueue.webRTC.sync {
            engineCommunication.updatePeerMetadata(metadata: metadata)
            localEndpoint = localEndpoint.with(metadata: metadata)
        }
    }

    /**
     Updates the metadata for a specific track.

        - Parameters:
         - trackId: local track id of audio or video track
         - trackMetadata: Data about this track that other peers will receive upon joining.

     If the metadata is different from what is already tracked in the room, the optional
     callback `onTrackUpdated` will be triggered for other peers in the room.
     */
    public func updateTrackMetadata(trackId: String, trackMetadata: Metadata) {
        DispatchQueue.webRTC.sync {
            engineCommunication.updateTrackMetadata(trackId: trackId, trackMetadata: trackMetadata)
            localEndpoint = localEndpoint.withTrack(trackId: trackId, metadata: trackMetadata, simulcastConfig: nil)
        }
    }

    /**
      Updates maximum bandwidth for the track identified by trackId.
      This value directly translates to quality of the stream and, in case of video, to the amount of RTP packets being sent.
      In case trackId points at the simulcast track bandwidth is split between all of the variant streams proportionally to their resolution.

        - Parameters:
         - trackId: track id of a video track
         - bandwidth: bandwidth in kbps
     */
    public func setTrackBandwidth(trackId: String, bandwidth: BandwidthLimit) {
        DispatchQueue.webRTC.sync {
            peerConnectionManager.setTrackBandwidth(trackId: trackId, bandwidth: bandwidth)
        }
    }

    /**
        Updates maximum bandwidth for the given simulcast encoding of the given track.

        - Parameters:
         - trackId: track id of a video track
         - encoding: rid of the encoding
         - bandwidth: bandwidth in kbps
     */
    public func setEncodingBandwidth(trackId: String, encoding: String, bandwidth: BandwidthLimit) {
        DispatchQueue.webRTC.sync {
            peerConnectionManager.setEncodingBandwidth(trackId: trackId, encoding: encoding, bandwidth: bandwidth)
        }
    }

    /// Adds given broadcast track to the peer connection and forces track renegotiation.
    private func setupScreencastTrack(
        track: LocalScreenBroadcastTrack, metadata: Metadata, simulcastConfig: SimulcastConfig?
    ) {
        let screencastStreamId = UUID().uuidString

        peerConnectionManager.addTrack(track: track, localStreamId: screencastStreamId)

        localEndpoint = localEndpoint.withTrack(
            trackId: track.rtcTrack().trackId, metadata: metadata, simulcastConfig: simulcastConfig)

        engineCommunication.renegotiateTracks()
    }

    /**
     Sets track encoding that server should send to the client library.

     The encoding will be sent whenever it is available.
     If choosen encoding is temporarily unavailable, some other encoding
     will be sent until choosen encoding becomes active again.

         - Parameters:
            - trackId: an id of a remote track
            - encoding: an encoding to receive
     */
    public func setTargetTrackEncoding(trackId: String, encoding: TrackEncoding) {
        DispatchQueue.webRTC.sync {
            engineCommunication.setTargetTrackEncoding(trackId: trackId, encoding: encoding)
        }
    }

    private func setTrackEncoding(trackId: String, encoding: TrackEncoding, enabled: Bool) {
        peerConnectionManager.setTrackEncoding(trackId: trackId, encoding: encoding, enabled: enabled)
    }

    /**
     Returns current connection stats.

     - Returns: a map containing statistics
     */
    public func getStats() -> [String: RTCStats] {
        DispatchQueue.webRTC.sync {
            return peerConnectionManager.getStats()
        }
    }

    /**
     Changes severity level of debug logs.

         - Parameters:
            - severity: enum value representing the logging severity
     */
    public func changeWebRTCLoggingSeverity(severity: RTCLoggingSeverity) {
        RTCSetMinDebugLogLevel(severity)
    }

    func onSendMediaEvent(event: SerializedMediaEvent) {
        notify {
            $0.onSendMediaEvent(event: event)
        }
    }

    func onConnected(endpointId: String, otherEndpoints: [Endpoint]) {
        localEndpoint = localEndpoint.with(id: endpointId)

        // initialize all present peers
        otherEndpoints.forEach { endpoint in
            self.remoteEndpoints[endpoint.id] = endpoint

            // initialize peer's track contexts
            endpoint.tracks?.forEach { trackId, trackData in
                let context = TrackContext(
                    track: nil, enpoint: endpoint, trackId: trackId, metadata: trackData.metadata,
                    simulcastConfig: trackData.simulcastConfig)

                self.trackContexts[trackId] = context

                self.notify {
                    $0.onTrackAdded(ctx: context)
                }
            }
        }

        notify {
            $0.onConnected(endpointId: endpointId, otherEndpoints: otherEndpoints)
        }
    }

    func onConnectionError() {
        notify {
            $0.onConnectionError(metadata: [:] as [String: Any])
        }
    }

    func onEndpointAdded(endpoint: Endpoint) {
        guard endpoint.id != localEndpoint.id else {
            return
        }

        remoteEndpoints[endpoint.id] = endpoint

        notify {
            $0.onEndpointAdded(endpoint: endpoint)
        }
    }

    func onEndpointRemoved(endpointId: String) {
        guard let endpoint = remoteEndpoints[endpointId] else {
            sdkLogger.error("Failed to process EndpointRemoved event: Endpoint not found: \(endpointId)")
            return
        }

        remoteEndpoints.removeValue(forKey: endpoint.id)

        // for a leaving peer clear his track contexts
        if let trackIds = endpoint.tracks?.keys {
            let contexts = trackIds.compactMap { id in
                self.trackContexts[id]
            }

            trackIds.forEach { id in
                self.trackContexts.removeValue(forKey: id)
            }

            contexts.forEach { context in
                self.notify {
                    $0.onTrackRemoved(ctx: context)
                }
            }
        }

        notify {
            $0.onEndpointRemoved(endpoint: endpoint)
        }
    }

    func onEndpointUpdated(endpointId: String, metadata: Metadata) {
        guard var endpoint = remoteEndpoints[endpointId] else {
            sdkLogger.error("Failed to process EndpointUpdated event: Endpoint not found: \(endpointId)")
            return
        }

        // update peer's metadata
        endpoint = endpoint.with(metadata: metadata)

        remoteEndpoints.updateValue(endpoint, forKey: endpoint.id)

        notify {
            $0.onEndpointUpdated(endpoint: endpoint)
        }
    }

    func onOfferData(integratedTurnServers: [OfferDataEvent.TurnServer], tracksTypes: [String: Int]) {
        peerConnectionManager.getSdpOffer(
            integratedTurnServers: integratedTurnServers, tracksTypes: tracksTypes, localTracks: localTracks
        ) { sdp, midToTrackId, error in
            if let err = error {
                sdkLogger.error("Failed to create sdp offer: \(err)")
                return
            }

            if let sdp = sdp, let midToTrackId = midToTrackId {
                self.engineCommunication.sdpOffer(
                    sdp: sdp,
                    trackIdToTrackMetadata: self.localEndpoint.tracks?.mapValues({ trackData in
                        trackData.metadata
                    }) ?? [:],
                    midToTrackId: midToTrackId)
            }

        }
    }

    func onSdpAnswer(type: String, sdp: String, midToTrackId: [String: String?]) {
        peerConnectionManager.onSdpAnswer(sdp: sdp, midToTrackId: midToTrackId, localTracks: localTracks)
    }

    func onRemoteCandidate(candidate: String, sdpMLineIndex: Int32, sdpMid: String?) {
        let candidate = RTCIceCandidate(sdp: candidate, sdpMLineIndex: sdpMLineIndex, sdpMid: sdpMid)

        peerConnectionManager.onRemoteCandidate(candidate: candidate)
    }

    func onTracksAdded(endpointId: String, tracks: [String: TrackData]) {
        // ignore local participant
        guard localEndpoint.id != endpointId else {
            return
        }

        guard var endpoint = remoteEndpoints[endpointId] else {
            sdkLogger.error("Failed to process TracksAdded event: Endpoint not found: \(endpointId)")
            return
        }

        // update tracks of the remote peer
        endpoint = endpoint.with(tracks: tracks)
        remoteEndpoints[endpoint.id] = endpoint

        // for each track create a corresponding track context
        endpoint.tracks?.forEach { trackId, trackData in
            let context = TrackContext(
                track: nil, enpoint: endpoint, trackId: trackId, metadata: trackData.metadata,
                simulcastConfig: trackData.simulcastConfig)

            self.trackContexts[trackId] = context

            self.notify {
                $0.onTrackAdded(ctx: context)
            }
        }
    }

    func onTracksRemoved(endpointId: String, trackIds: [String]) {
        guard let _ = remoteEndpoints[endpointId] else {
            sdkLogger.error("Failed to process TracksRemoved event: Endpoint not found: \(endpointId)")
            return
        }

        // for each track clear its context and notify delegates
        trackIds.forEach { id in
            guard let context = self.trackContexts[id] else {
                sdkLogger.error("Failed to process TracksRemoved event: Track not found: \(id)")
                return
            }

            self.trackContexts.removeValue(forKey: id)

            self.notify {
                $0.onTrackRemoved(ctx: context)
            }
        }
    }

    func onTrackUpdated(endpointId: String, trackId: String, metadata: Metadata) {
        guard let context = self.trackContexts[trackId] else {
            sdkLogger.error("Failed to process TrackUpdated event: Track not found: \(trackId)")
            return
        }

        context.metadata = metadata

        notify {
            $0.onTrackUpdated(ctx: context)
        }
    }

    func onTrackEncodingChanged(endpointId: String, trackId: String, encoding: String, encodingReason: String) {
        if let trackEncoding = TrackEncoding.fromString(encoding),
            let trackContext = self.trackContexts[trackId],
            let encodingReasonEnum = EncodingReason(rawValue: encodingReason)
        {
            trackContext.setEncoding(encoding: trackEncoding, encodingReason: encodingReasonEnum)
        }
    }

    func onVadNotification(trackId: String, status: String) {
        if let vadStatus = VadStatus(rawValue: status),
            let trackContext = self.trackContexts[trackId]
        {
            trackContext.vadStatus = vadStatus
        }
    }

    func onBandwidthEstimation(estimation: Int) {
        self.notify {
            $0.onBandwidthEstimationChanged(estimation: estimation)
        }
    }

    /// Sends the local ice candidate to the `Membrane RTC Engine` instance via transport layer.
    func onLocalIceCandidate(candidate: RTCIceCandidate) {
        engineCommunication.localCandidate(sdp: candidate.sdp, sdpMLineIndex: candidate.sdpMLineIndex)
    }

    func onAddTrack(trackId: String, track: RTCMediaStreamTrack) {
        guard let trackContext = trackContexts[trackId]
        else {
            sdkLogger.error(
                "\(pcLogPrefix) started receiving on a transceiver without registered track context"
            )
            return
        }

        // assign given receiver to its track's context
        if let audioTrack = track as? RTCAudioTrack {
            trackContext.track = RemoteAudioTrack(track: audioTrack)
        }

        if let videoTrack = track as? RTCVideoTrack {
            trackContext.track = RemoteVideoTrack(track: videoTrack)
        }

        notify {
            $0.onTrackReady(ctx: trackContext)
        }
    }

    func onPeerConnectionStateChange(newState: RTCIceConnectionState) {
        switch newState {
        case .connected:
            state = .connected
        case .disconnected:
            state = .disconnected
        default:
            break
        }
    }

    func prepareToReconnect() {
        DispatchQueue.webRTC.sync {
            peerConnectionManager.close()
            prevLocalTracks = localTracks
            localTracks = []
            let metadata = localEndpoint.metadata
            localEndpoint = Endpoint(id: "", type: "webrtc", metadata: metadata, tracks: [:])
            state = .awaitingConnect
        }
    }

    func reconnect() {
        DispatchQueue.webRTC.sync {
            prevLocalTracks.forEach { track in
                switch track {
                case let track as LocalVideoTrack:
                    let videoTrack = LocalVideoTrack(
                        oldTrack: track,
                        peerConnectionFactoryWrapper: peerConnectionFactoryWrapper)
                    localTracks.append(videoTrack)

                    localEndpoint = localEndpoint.withTrack(
                        trackId: videoTrack.rtcTrack().trackId, metadata: trackContexts[track.trackId()]?.metadata,
                        simulcastConfig: trackContexts[track.trackId()]?.simulcastConfig)

                    break
                case let track as LocalAudioTrack:
                    let audioTrack = LocalAudioTrack(
                        oldTrack: track, peerConnectionFactoryWrapper: peerConnectionFactoryWrapper)
                    localTracks.append(audioTrack)
                    localEndpoint = localEndpoint.withTrack(
                        trackId: audioTrack.trackId(), metadata: trackContexts[track.trackId()]?.metadata,
                        simulcastConfig: nil)
                    break
                default:
                    break
                }
                trackContexts.removeValue(forKey: track.trackId())
            }
            prevLocalTracks = []
            engineCommunication.connect(metadata: localEndpoint.metadata)

        }
    }
}

extension DispatchQueue {
    static let webRTC = DispatchQueue(label: "membrane.rtc.webRTC")
}
