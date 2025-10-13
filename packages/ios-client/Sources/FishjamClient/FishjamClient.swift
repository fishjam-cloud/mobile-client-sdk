import CallKit
import Starscream
import WebRTC

public struct ConnectConfig {
    var websocketUrl: String
    var token: String
    var peerMetadata: Metadata
    var reconnectConfig: ReconnectConfig

    public init(websocketUrl: String, token: String, peerMetadata: Metadata, reconnectConfig: ReconnectConfig) {
        self.websocketUrl = websocketUrl + "/socket/peer/websocket"
        self.token = token
        self.peerMetadata = peerMetadata
        self.reconnectConfig = reconnectConfig
    }
}

internal protocol FishjamWebsocket {
    var delegate: WebSocketDelegate? { get set }
    func connect()
    func disconnect(closeCode: UInt16)
    func write(data: Data)
}

public class FishjamClientWebSocket: FishjamWebsocket {
    var socket: Starscream.WebSocket
    var delegate: WebSocketDelegate? {
        set { self.socket.delegate = newValue }
        get { self.socket.delegate }
    }

    public init(socket: Starscream.WebSocket) {
        self.socket = socket
    }

    func connect() {
        socket.connect()
    }

    func disconnect(closeCode: UInt16 = CloseCode.normal.rawValue) {
        socket.disconnect(closeCode: closeCode)
        // Starscream doesn't emit any event on client initiated disconnect, so we need to force it.
        delegate?.didReceive(event: .cancelled, client: socket)
    }

    func write(data: Data) {
        socket.write(data: data)
    }
}

internal func websocketFactory(url: String) -> FishjamWebsocket {
    let url = URL(string: url)
    let urlRequest = URLRequest(url: url!)
    return FishjamClientWebSocket(socket: WebSocket(request: urlRequest))
}

public class FishjamClient {
    private var client: FishjamClientInternal

    public init(listener: FishjamClientListener) {
        self.client = FishjamClientInternal(listener: listener, websocketFactory: websocketFactory)
    }


    /**
    * Connects to the server using the WebSocket connection
    *
    * @param config - Configuration object for the client
    */
    public func connect(config: ConnectConfig) {
        client.connect(config: config)
    }

    /**
    * Leaves the room. This function should be called when user leaves the room in a clean way e.g. by clicking a
    * dedicated, custom button `disconnect`. As a result there will be generated one more media event that should be sent
    * to the RTC Engine. Thanks to it each other peer will be notified that peer left in onPeerLeft,
    */
    public func leave(onLeave: (() -> Void)? = nil) {
        client.leave(onLeave: onLeave)
    }

    /**
    * Creates a video track utilizing device's camera.
    *
    * The client assumes that the user has already granted camera permissions.
    *
    * @param videoParameters a set of target parameters such as camera resolution, frame rate or simulcast configuration
    * @param metadata the metadata that will be sent to the <strong>Membrane RTC Engine</strong> for media negotiation
    * @param captureDeviceName the name of the device to start video capture with, you can get device name by using
    * `LocalVideoTrack.getCaptureDevices` method
    * @return an instance of the video track
    */
    public func createVideoTrack(
        videoParameters: VideoParameters,
        metadata: Metadata,
        captureDeviceName: String? = nil
    ) -> LocalCameraTrack {
        return client.createCameraTrack(
            videoParameters: videoParameters,
            metadata: metadata,
            captureDeviceName: captureDeviceName
        )
    }

    /**
    * Creates an audio track utilizing device's microphone.
    *
    * The client assumes that the user has already granted microphone recording permissions.
    *
    * @param metadata the metadata that will be sent to the <strong>Membrane RTC Engine</strong> for media negotiation
    * @return an instance of the audio track
    */
    public func createAudioTrack(metadata: Metadata) -> LocalAudioTrack {
        return client.createAudioTrack(metadata: metadata)
    }

    /**
    * Prepares functionality allowing for recording and sending the entire device's screen.
    *
    * The method requires a media projection permission to be able to start the recording. The client assumes that the intent is valid.
    * @param appGroup an application group identifier used to allow communication between user app and upload extension
    * @param videoParameters a set of target parameters of the screen capture such as resolution, frame rate or simulcast configuration
    * @param metadata the metadata that will be sent to the <strong>WebRTC Engine</strong> for media negotiation
    * @param canStart callback that will be invoked once tbefore the screen capture starts, and if returns true then capture starts, otherwise it stops
    * @param onStart callback that will be invoked once the screen capture starts
    * @param onStop callback that will be invoked once the screen capture stops
    */
    public func prepareForScreenBroadcast(
        appGroup: String,
        videoParameters: VideoParameters,
        metadata: Metadata,
        canStart: @escaping () -> Bool,
        onStart: @escaping () -> Void,
        onStop: @escaping () -> Void
    ) {
        client.prepareForBroadcastScreenSharing(
            appGroup: appGroup,
            videoParameters: videoParameters,
            metadata: metadata,
            canStart: canStart,
            onStart: onStart,
            onStop: onStop
        )
    }

    public func create(customSource: CustomSource) async throws {
        try await client.create(customSource: customSource)
    }

    public func remove(customSource: CustomSource) {
        client.remove(customSource: customSource)
    }

    /**
  * Creates a app screencast track utilizing `RPScreenRecorder`
  *
  * @param videoParameters a set of target parameters of the screen capture such as resolution, frame rate or simulcast configuration
  * @param metadata the metadata that will be sent to the <strong>Membrane RTC Engine</strong> for media negotiation
  * @return an instance of the app screencast track
  */
    public func createScreenAppTrack(
        videoParameters: VideoParameters,
        metadata: Metadata
    ) -> LocalAppScreenShareTrack {
        return client.createAppScreenShareTrack(videoParameters: videoParameters, metadata: metadata)
    }

    /**
    * Removes an instance of local track from the client.
    *
    * @param trackId an id of a valid local track that has been created using the current client
    */
    public func removeTrack(trackId: String) {
        client.removeTrack(trackId: trackId)
    }

    /**
    * Sets track encoding that server should send to the client library.
    *
    * The encoding will be sent whenever it is available.
    * If chosen encoding is temporarily unavailable, some other encoding
    * will be sent until chosen encoding becomes active again.
    *
    * @param trackId an id of a remote track
    * @param encoding an encoding to receive
    */
    public func setTargetTrackEncoding(trackId: String, encoding: TrackEncoding) {
        client.setTargetTrackEncoding(trackId: trackId, encoding: encoding)
    }

    /**
    * Enables track encoding so that it will be sent to the server.
    *
    * @param trackId an id of a local track
    * @param encoding an encoding that will be enabled
    */
    public func enableTrackEncoding(trackId: String, encoding: TrackEncoding) {
        client.enableTrackEncoding(trackId: trackId, encoding: encoding)
    }

    /**
    * Disables track encoding so that it will be no longer sent to the server.
    *
    * @param trackId and id of a local track
    * @param encoding an encoding that will be disabled
    */
    public func disableTrackEncoding(trackId: String, encoding: TrackEncoding) {
        client.disableTrackEncoding(trackId: trackId, encoding: encoding)
    }

    /**
    * Updates the metadata for the current peer.
    * @param peerMetadata Data about this peer that other peers will receive upon joining.
    *
    * If the metadata is different from what is already tracked in the room, the optional
    * callback `onPeerUpdated` will be triggered for other peers in the room.
    */
    public func updatePeerMetadata(metadata: Metadata) {
        client.updatePeerMetadata(metadata: metadata)
    }

    /**
    * Updates the metadata for a specific track.
    * @param trackId local track id of audio or video track.
    * @param trackMetadata Data about this track that other peers will receive upon joining.
    *
    * If the metadata is different from what is already tracked in the room, the optional
    * callback `onTrackUpdated` will be triggered for other peers in the room.
    */
    public func updateTrackMetadata(trackId: String, metadata: Metadata) {
        client.updateTrackMetadata(trackId: trackId, metadata: metadata)
    }

    /**
    * Updates maximum bandwidth for the track identified by trackId.
    * This value directly translates to quality of the stream and, in case of video, to the amount of RTP packets being sent.
    * In case trackId points at the simulcast track bandwidth is split between all of the variant streams proportionally to their resolution.
    * @param trackId track id of a video track
    * @param bandwidthLimit bandwidth in kbps
    */
    public func setTrackBandwidth(trackId: String, bandwidthLimit: BandwidthLimit) {
        client.setTrackBandwidth(trackId: trackId, bandwidth: bandwidthLimit)
    }

    /**
    * Updates maximum bandwidth for the given simulcast encoding of the given track.
    * @param trackId track id of a video track
    * @param encoding rid of the encoding
    * @param bandwidthLimit bandwidth in kbps
    */
    public func setEncodingBandwidth(
        trackId: String,
        encoding: String,
        bandwidthLimit: BandwidthLimit
    ) {
        client.setEncodingBandwidth(trackId: trackId, encoding: encoding, bandwidth: bandwidthLimit)
    }

    /**
    * Changes severity level of debug logs
    * @param severity enum value representing the logging severity
    */
    public func changeWebRTCLoggingSeverity(severity: RTCLoggingSeverity) {
        client.changeWebRTCLoggingSeverity(severity: severity)
    }

    /**
    * Returns current connection stats
    * @return a map containing statistics
    */
    public func getStats() async -> [String: RTCStats] {
        return await client.getStats()
    }

    public func getLocalEndpoint() -> Endpoint {
        return client.localEndpoint
    }

    public func getRemoteEndpoints() -> [Endpoint] {
        return client.remoteEndpoints
    }
    
    public var lastSdpAnswer: SdpInfo? {
        return client.lastSdpAnswer
    }
}
