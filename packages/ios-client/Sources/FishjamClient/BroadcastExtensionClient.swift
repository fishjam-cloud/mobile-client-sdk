import Foundation
import Starscream
import WebRTC
import ReplayKit

/// Delegate protocol for BroadcastExtensionClient events
public protocol BroadcastExtensionClientDelegate: AnyObject {
    /// Called when the client successfully connects to the Fishjam server
    /// and is ready to start screen sharing
    func broadcastClientDidConnect(_ client: BroadcastExtensionClient)
    
    /// Called when reconnection process has started
    func broadcastClientDidStartReconnection(_ client: BroadcastExtensionClient)
    
    /// Called when client successfully reconnects after a disconnection
    func broadcastClientDidReconnect(_ client: BroadcastExtensionClient)
    
    /// Called when maximum reconnection attempts have been reached
    func broadcastClientReconnectionLimitReached(_ client: BroadcastExtensionClient)
}

/// Minimal configuration needed to initialize broadcast screenshare from extension
public struct BroadcastExtensionConfig: Codable {
    public let websocketUrl: String
    public let token: String
    public let metadata: Metadata
    public let videoParameters: VideoParameters
    public let sdkVersion: String
    public let reconnectConfig: ReconnectConfig
    
    public init(websocketUrl: String, token: String, metadata: Metadata, videoParameters: VideoParameters, sdkVersion: String, reconnectConfig: ReconnectConfig = ReconnectConfig()) {
        self.websocketUrl = websocketUrl
        self.token = token
        self.metadata = metadata
        self.videoParameters = videoParameters
        self.sdkVersion = sdkVersion
        self.reconnectConfig = reconnectConfig
    }
}

/// A minimal WebRTC client specifically designed for iOS Broadcast Upload Extensions.
/// This class handles only what's necessary to send screen share frames:
/// - WebSocket connection and authentication
/// - Minimal PeerConnection setup
/// - Single video track for screen sharing
/// - Frame capture and sending
///
/// Unlike `FishjamClientInternal`, this is optimized for the broadcast extension use case
/// where we only need to send one video track and don't need to receive anything.
public class BroadcastExtensionClient {
    
    // MARK: - Core Components
    private var webSocket: Starscream.WebSocket?
    private var peerConnectionFactory: PeerConnectionFactoryWrapper
    private var peerConnectionManager: PeerConnectionManager
    private var rtcEngineCommunication: RTCEngineCommunication
    
    // MARK: - State
    private var config: BroadcastExtensionConfig?
    private var isAuthenticated = false
    private var isConnected = false
    private var localEndpointId: String = ""
    
    // MARK: - Video Components
    private var videoSource: RTCVideoSource?
    private var videoTrack: RTCVideoTrack?
    private var localTrack: LocalBroadcastScreenShareTrack?
    private var prevLocalTrack: LocalBroadcastScreenShareTrack?
    
    // MARK: - Reconnection
    private var reconnectionManager: ReconnectionManager?
    
    // MARK: - Logger
    private let logger = "BroadcastExtensionClient"
    
    // MARK: - Delegate
    public weak var delegate: BroadcastExtensionClientDelegate?
    
    // MARK: - Initialization
    
    public init() {
        // Initialize WebRTC factory
        self.peerConnectionFactory = PeerConnectionFactoryWrapper(encoder: .DEFAULT)
        
        // Initialize RTC communication
        self.rtcEngineCommunication = RTCEngineCommunication(listeners: [])
        
        // Initialize peer connection manager
        self.peerConnectionManager = PeerConnectionManager(
            config: RTCConfiguration(),
            peerConnectionFactory: peerConnectionFactory
        )
        
        // Set up listeners
        self.rtcEngineCommunication.addListener(self)
        self.peerConnectionManager.addListener(self)
    }
    
    // MARK: - Public API
    
    /// Connects to Fishjam server and prepares for screen sharing
    /// - Parameter config: Configuration with websocket URL, token, and track metadata
    public func connect(config: BroadcastExtensionConfig) {
        self.config = config
        
        // Initialize reconnection manager
        self.reconnectionManager = ReconnectionManager(
            reconnectConfig: config.reconnectConfig,
            connect: { [weak self] in self?.reconnect(config: config) },
            listener: self
        )
        
        setupWebSocket(config: config)
    }
    
    /// Internal method to reconnect after disconnection
    private func reconnect(config: BroadcastExtensionConfig) {
        recreateTrack()
        setupWebSocket(config: config)
    }
    
    /// Sets up the WebSocket connection
    private func setupWebSocket(config: BroadcastExtensionConfig) {
        // Create WebSocket connection
        guard let url = URL(string: config.websocketUrl + "/socket/peer/websocket") else {
            sdkLogger.error("\(logger): Invalid WebSocket URL")
            return
        }
        
        var request = URLRequest(url: url)
        request.timeoutInterval = 5
        
        self.webSocket = Starscream.WebSocket(request: request)
        self.webSocket?.delegate = self
        self.webSocket?.connect()
        
        sdkLogger.info("\(logger): Connecting to \(config.websocketUrl)")
    }
    
    /// Starts capturing and sending screen share frames
    /// - Returns: A capturer object that can process sample buffers
    public func startScreenShare() -> BroadcastScreenShareCapturer? {
        guard isConnected else {
            sdkLogger.error("\(logger): Cannot start screen share - not connected")
            return nil
        }
        
        guard let config = config else {
            sdkLogger.error("\(logger): Cannot start screen share - no config")
            return nil
        }
        
        // Create video source and track
        let videoSource = peerConnectionFactory.createVideoSource(forScreenCast: true)
        let webrtcTrack = peerConnectionFactory.createVideoTrack(source: videoSource)
        
        // Create local track object
        let track = LocalBroadcastScreenShareTrack(
            mediaTrack: webrtcTrack,
            videoSource: videoSource,
            endpointId: localEndpointId,
            metadata: config.metadata,
            appGroup: "", // Not needed for this approach
            videoParameters: config.videoParameters
        )
        
        self.videoSource = videoSource
        self.videoTrack = webrtcTrack
        self.localTrack = track
        
        // Add track to peer connection
        peerConnectionManager.addTrack(track: track)
        
        // Request renegotiation to add the track
        rtcEngineCommunication.renegotiateTracks()
        
        // Create and return capturer
        let capturer = BroadcastScreenShareCapturer(videoSource: videoSource, videoParameters: config.videoParameters)
        
        sdkLogger.info("\(logger): Screen share track created and added")
        return capturer
    }
    
    /// Stops screen sharing and disconnects
    public func disconnect() {
        reconnectionManager?.reset()
        webSocket?.disconnect()
        peerConnectionManager.close()
        videoSource = nil
        videoTrack = nil
        localTrack = nil
        prevLocalTrack = nil
        isAuthenticated = false
        isConnected = false
        sdkLogger.info("\(logger): Disconnected")
    }
    
    // MARK: - Private Helpers
    
    /// Prepares the client for reconnection by cleaning up current state
    private func prepareToReconnect() {
        peerConnectionManager.close()
        webSocket?.disconnect()
        webSocket = nil
        
        // Save the current track for recreation
        prevLocalTrack = localTrack
        
        // Reset state
        isAuthenticated = false
        isConnected = false
        localEndpointId = ""
        
        // Keep video source and track references for recreation
        // but don't clear them yet as we'll need them
        
        sdkLogger.info("\(logger): Prepared for reconnection")
    }
    
    /// Recreates the video track after reconnection
    private func recreateTrack() {
        guard let prevTrack = prevLocalTrack,
              let config = config else {
            sdkLogger.error("\(logger): Cannot recreate track - missing previous track or config")
            return
        }
        
        // Create new video source and track
        let newVideoSource = peerConnectionFactory.createVideoSource(forScreenCast: true)
        let newWebrtcTrack = peerConnectionFactory.createVideoTrack(source: newVideoSource)
        
        // Create new local track with same metadata and keeping the old endpoint ID
        // The endpoint ID is just informational and will be correct once we reconnect
        let newTrack = LocalBroadcastScreenShareTrack(
            mediaTrack: newWebrtcTrack,
            videoSource: newVideoSource,
            endpointId: prevTrack.endpointId, // Keep the old endpoint ID (it's immutable anyway)
            metadata: prevTrack.metadata,
            appGroup: "",
            videoParameters: config.videoParameters
        )
        
        // Update our references
        self.videoSource = newVideoSource
        self.videoTrack = newWebrtcTrack
        self.localTrack = newTrack
        self.prevLocalTrack = nil
        
        sdkLogger.info("\(logger): Track recreated for reconnection")
    }
    
    private func handleAuthenticated(roomType: Fishjam_PeerMessage.RoomType) {
        isAuthenticated = true
        sdkLogger.info("\(logger): Authenticated successfully")
        
        // Send connect message to join the room
        rtcEngineCommunication.connect(metadata: config?.metadata ?? [:].toMetadata())
    }
    
    private func sendWebSocketMessage(_ message: Fishjam_PeerMessage) {
        guard let data = try? message.serializedData() else {
            sdkLogger.error("\(logger): Failed to serialize message")
            return
        }
        webSocket?.write(data: data)
    }
}

// MARK: - WebSocket Delegate

extension BroadcastExtensionClient: WebSocketDelegate {
    public func didReceive(event: WebSocketEvent, client: WebSocketClient) {
        switch event {
        case .connected(_):
            sdkLogger.info("\(logger): WebSocket connected")
            
            // Send authentication request
            let authRequest = Fishjam_PeerMessage.with {
                $0.authRequest = Fishjam_PeerMessage.AuthRequest.with {
                    $0.token = self.config?.token ?? ""
                    $0.sdkVersion = self.config?.sdkVersion ?? "mobile-unknown"
                }
            }
            sendWebSocketMessage(authRequest)
            
        case .disconnected(let reason, let code):
            sdkLogger.info("\(logger): WebSocket disconnected: \(reason) (\(code))")
            isAuthenticated = false
            isConnected = false
            
        case .binary(let data):
            // Handle incoming protobuf messages
            do {
                let message = try Fishjam_PeerMessage(serializedData: data)
                
                if case .authenticated(let content) = message.content {
                    handleAuthenticated(roomType: content.roomType)
                } else if case .serverMediaEvent(_) = message.content {
                    rtcEngineCommunication.onEvent(event: message.serverMediaEvent)
                }
            } catch {
                sdkLogger.error("\(logger): Failed to parse message: \(error)")
            }
            
        case .viabilityChanged(let isViable):
            // Network viability changed - trigger reconnection if lost
            if !isViable {
                sdkLogger.warning("\(logger): Network viability lost")
                prepareToReconnect()
                reconnectionManager?.onDisconnected()
            }
            
        case .error(let error):
            sdkLogger.error("\(logger): WebSocket error: \(error?.localizedDescription ?? "unknown")")
            prepareToReconnect()
            reconnectionManager?.onDisconnected()
            
        case .cancelled:
            sdkLogger.info("\(logger): WebSocket cancelled")
            
        default:
            break
        }
    }
}

// MARK: - RTCEngine Listener

extension BroadcastExtensionClient: RTCEngineListener {
    
    func onSendMediaEvent(event: Fishjam_MediaEvents_Peer_MediaEvent.OneOf_Content) {
        guard isAuthenticated else {
            sdkLogger.error("\(logger): Tried to send media event before authentication")
            return
        }
        
        let mediaEvent = Fishjam_PeerMessage.with {
            $0.peerMediaEvent = Fishjam_MediaEvents_Peer_MediaEvent.with {
                switch event {
                case .connect(let connect):
                    $0.connect = connect
                case .renegotiateTracks(let renegotiate):
                    $0.renegotiateTracks = renegotiate
                case .sdpOffer(let offer):
                    $0.sdpOffer = offer
                case .candidate(let candidate):
                    $0.candidate = candidate
                default:
                    break
                }
            }
        }
        
        sendWebSocketMessage(mediaEvent)
    }
    
    func onConnected(
        endpointId: String,
        endpointIdToEndpoint: [String: Fishjam_MediaEvents_Server_MediaEvent.Endpoint],
        iceServers: [Fishjam_MediaEvents_Server_MediaEvent.IceServer]
    ) {
        self.localEndpointId = endpointId
        self.isConnected = true
        
        // Setup ICE servers
        peerConnectionManager.setupIceServers(iceServers: iceServers)
        
        sdkLogger.info("\(logger): Connected with endpoint ID: \(endpointId)")
        
        // If we have a track (reconnecting), re-add it and trigger renegotiation
        // The track keeps its original endpoint ID (it's immutable), which is fine
        if let track = localTrack {
            peerConnectionManager.addTrack(track: track)
            rtcEngineCommunication.renegotiateTracks()
            
            sdkLogger.info("\(logger): Track re-added after reconnection")
        }
        
        // Notify reconnection manager of successful reconnection
        reconnectionManager?.onReconnected()
        
        // Notify delegate that connection is ready
        delegate?.broadcastClientDidConnect(self)
    }
    
    func onOfferData(tracksTypes: Fishjam_MediaEvents_Server_MediaEvent.OfferData.TrackTypes) {
        guard let track = localTrack else {
            sdkLogger.error("\(logger): No local track available")
            return
        }
        
        peerConnectionManager.getSdpOffer(
            tracksTypes: tracksTypes,
            localTracks: [track]
        ) { sdp, midToTrackId, trackIdToBitrates, error in
            if let err = error {
                sdkLogger.error("\(self.logger): Failed to create SDP offer: \(err)")
                return
            }
            
            if let sdp = sdp,
               let midToTrackId = midToTrackId,
               let trackIdToBitrates = trackIdToBitrates {
                
                var trackMetadata: [String: Metadata] = [:]
                trackMetadata[track.webrtcId] = track.metadata
                
                self.rtcEngineCommunication.sdpOffer(
                    sdp: sdp,
                    trackIdToTrackMetadata: trackMetadata,
                    midToTrackId: midToTrackId,
                    trackIdToBitrates: trackIdToBitrates
                )
                
                sdkLogger.info("\(self.logger): SDP offer sent")
            }
        }
    }
    
    func onSdpAnswer(sdp: String, midToTrackId: [String: String]) {
        peerConnectionManager.onSdpAnswer(sdp: sdp, midToTrackId: midToTrackId)
        sdkLogger.info("\(logger): SDP answer received and set")
    }
    
    func onRemoteCandidate(candidate: String, sdpMLineIndex: Int32, sdpMid: String?) {
        let iceCandidate = RTCIceCandidate(sdp: candidate, sdpMLineIndex: sdpMLineIndex, sdpMid: sdpMid)
        peerConnectionManager.onRemoteCandidate(candidate: iceCandidate)
    }
    
    // Minimal implementations for other required methods
    func onEndpointAdded(endpointId: String, metadata: Metadata?) {}
    func onEndpointRemoved(endpointId: String) {}
    func onEndpointUpdated(endpointId: String, metadata: Metadata?) {}
    func onTracksAdded(endpointId: String, trackIdToTracks: [String: Fishjam_MediaEvents_Server_MediaEvent.Track]) {}
    func onTracksRemoved(endpointId: String, trackIds: [String]) {}
    func onTrackUpdated(endpointId: String, trackId: String, metadata: Metadata) {}
    func onTrackEncodingChanged(endpointId: String, trackId: String, encoding: String, encodingReason: String) {}
    func onVadNotification(trackId: String, status: Fishjam_MediaEvents_Server_MediaEvent.VadNotification.Status) {}
    func onBandwidthEstimation(estimation: Int) {}
}

// MARK: - PeerConnection Listener

extension BroadcastExtensionClient: PeerConnectionListener {
    
    func onLocalIceCandidate(candidate: RTCIceCandidate) {
        let splitSdp = candidate.sdp.split(separator: " ")
        guard let ufragIndex = splitSdp.firstIndex(of: "ufrag") else {
            return
        }
        let ufrag = String(splitSdp[ufragIndex + 1])
        
        rtcEngineCommunication.localCandidate(
            sdp: candidate.sdp,
            sdpMLineIndex: candidate.sdpMLineIndex,
            sdpMid: Int32(candidate.sdpMid ?? "0") ?? 0,
            usernameFragment: ufrag
        )
    }
    
    func onAddTrack(trackId: String, webrtcTrack: RTCMediaStreamTrack) {
        // We're only sending, not receiving tracks
    }
}

// MARK: - ReconnectionManager Listener

extension BroadcastExtensionClient: ReconnectionManagerListener {
    
    public func onReconnectionStarted() {
        sdkLogger.info("\(logger): Reconnection started")
        delegate?.broadcastClientDidStartReconnection(self)
    }
    
    public func onReconnected() {
        sdkLogger.info("\(logger): Reconnected successfully")
        delegate?.broadcastClientDidReconnect(self)
    }
    
    public func onReconnectionRetriesLimitReached() {
        sdkLogger.error("\(logger): Reconnection retries limit reached")
        delegate?.broadcastClientReconnectionLimitReached(self)
    }
}

// MARK: - Simple Frame Capturer

/// A simple capturer that converts RPBroadcast sample buffers to WebRTC video frames
/// with support for resolution scaling and FPS limiting based on VideoParameters
public class BroadcastScreenShareCapturer {
    private let videoSource: RTCVideoSource
    private let videoParameters: VideoParameters
    
    // FPS limiting
    private var lastFrameTimestamp: Int64 = 0
    private let minFrameInterval: Int64  // in nanoseconds
    
    init(videoSource: RTCVideoSource, videoParameters: VideoParameters) {
        self.videoSource = videoSource
        self.videoParameters = videoParameters
        
        // Calculate minimum frame interval based on maxFps
        // e.g., if maxFps = 15, then minFrameInterval = 1_000_000_000 / 15 = 66_666_666 ns
        self.minFrameInterval = Int64(1_000_000_000) / Int64(max(1, videoParameters.maxFps))
    }
    
    /// Processes a sample buffer from the broadcast extension
    /// Call this from `processSampleBuffer(_:with:)` in your RPBroadcastSampleHandler
    public func processSampleBuffer(_ sampleBuffer: CMSampleBuffer, with sampleBufferType: RPSampleBufferType) {
        guard sampleBufferType == .video else { return }
        guard sampleBuffer.isValid else { return }
        
        guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else {
            return
        }
        
        // FPS limiting: drop frame if it arrives too soon
        let currentTimestamp = sampleBuffer.presentationTimeStamp.value
        let timeSinceLastFrame = currentTimestamp - lastFrameTimestamp
        
        if lastFrameTimestamp > 0 && timeSinceLastFrame < minFrameInterval {
            // Drop this frame - it's too soon
            return
        }
        
        lastFrameTimestamp = currentTimestamp
        
        let originalHeight = Int32(CVPixelBufferGetHeight(pixelBuffer))
        let originalWidth = Int32(CVPixelBufferGetWidth(pixelBuffer))
        
        // Calculate target dimensions based on video parameters
        let targetDimensions = downscaleResolution(
            from: Dimensions(width: originalWidth, height: originalHeight),
            to: videoParameters.dimensions
        )
        
        // Scale the pixel buffer to target dimensions if needed
        let scaledPixelBuffer: CVPixelBuffer
        if originalWidth != targetDimensions.width || originalHeight != targetDimensions.height {
            scaledPixelBuffer = scalePixelBuffer(
                pixelBuffer,
                targetWidth: Int(targetDimensions.width),
                targetHeight: Int(targetDimensions.height)
            )
        } else {
            scaledPixelBuffer = pixelBuffer
        }
        
        let finalHeight = Int32(CVPixelBufferGetHeight(scaledPixelBuffer))
        let finalWidth = Int32(CVPixelBufferGetWidth(scaledPixelBuffer))
        
        // Tell WebRTC about our output format
        videoSource.adaptOutputFormat(
            toWidth: finalWidth,
            height: finalHeight,
            fps: Int32(videoParameters.maxFps)
        )
        
        let rtcBuffer = RTCCVPixelBuffer(
            pixelBuffer: scaledPixelBuffer,
            adaptedWidth: finalWidth,
            adaptedHeight: finalHeight,
            cropWidth: finalWidth,
            cropHeight: finalHeight,
            cropX: 0,
            cropY: 0
        )
        
        let videoFrame = RTCVideoFrame(
            buffer: rtcBuffer,
            rotation: ._0,
            timeStampNs: sampleBuffer.presentationTimeStamp.value
        )
        
        let delegate = videoSource as RTCVideoCapturerDelegate
        delegate.capturer(RTCVideoCapturer(delegate: videoSource), didCapture: videoFrame)
    }
    
    /// Calculates the appropriate downscaled resolution while maintaining aspect ratio
    private func downscaleResolution(from: Dimensions, to: Dimensions) -> Dimensions {
        if from.height > to.height {
            let ratio = Float(from.height) / Float(from.width)
            
            let newHeight = to.height
            let newWidth = Int32((Float(newHeight) / ratio).rounded(.down))
            
            return Dimensions(width: newWidth, height: newHeight)
        } else if from.width > to.width {
            let ratio = Float(from.height) / Float(from.width)
            
            let newWidth = to.width
            let newHeight = Int32((Float(newWidth) * ratio).rounded(.down))
            
            return Dimensions(width: newWidth, height: newHeight)
        }
        
        return from
    }
    
    /// Scales a CVPixelBuffer to the target dimensions using Core Image
    private func scalePixelBuffer(_ pixelBuffer: CVPixelBuffer, targetWidth: Int, targetHeight: Int) -> CVPixelBuffer {
        let ciImage = CIImage(cvPixelBuffer: pixelBuffer)
        
        let scaleX = CGFloat(targetWidth) / CGFloat(CVPixelBufferGetWidth(pixelBuffer))
        let scaleY = CGFloat(targetHeight) / CGFloat(CVPixelBufferGetHeight(pixelBuffer))
        
        let scaledImage = ciImage.transformed(by: CGAffineTransform(scaleX: scaleX, y: scaleY))
        
        var scaledPixelBuffer: CVPixelBuffer?
        let attributes: [String: Any] = [
            kCVPixelBufferCGImageCompatibilityKey as String: true,
            kCVPixelBufferCGBitmapContextCompatibilityKey as String: true,
            kCVPixelBufferMetalCompatibilityKey as String: true
        ]
        
        let status = CVPixelBufferCreate(
            kCFAllocatorDefault,
            targetWidth,
            targetHeight,
            CVPixelBufferGetPixelFormatType(pixelBuffer),
            attributes as CFDictionary,
            &scaledPixelBuffer
        )
        
        guard status == kCVReturnSuccess, let outputBuffer = scaledPixelBuffer else {
            // If scaling fails, return original buffer
            sdkLogger.warning("BroadcastScreenShareCapturer: Failed to create scaled pixel buffer, using original")
            return pixelBuffer
        }
        
        let context = CIContext()
        context.render(scaledImage, to: outputBuffer)
        
        return outputBuffer
    }
}

