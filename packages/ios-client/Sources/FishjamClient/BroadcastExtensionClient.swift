import Foundation
import Starscream
import WebRTC
import ReplayKit

/// Delegate protocol for BroadcastExtensionClient events
public protocol BroadcastExtensionClientDelegate: AnyObject {
    /// Called when the client successfully connects to the Fishjam server
    /// and is ready to start screen sharing
    func broadcastClientDidConnect(_ client: BroadcastExtensionClient)
}

/// Minimal configuration needed to initialize broadcast screenshare from extension
public struct BroadcastExtensionConfig: Codable {
    public let websocketUrl: String
    public let token: String
    public let metadata: Metadata
    public let videoParameters: VideoParameters
    public let sdkVersion: String
    
    public init(websocketUrl: String, token: String, metadata: Metadata, videoParameters: VideoParameters, sdkVersion: String) {
        self.websocketUrl = websocketUrl
        self.token = token
        self.metadata = metadata
        self.videoParameters = videoParameters
        self.sdkVersion = sdkVersion
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
        
        // Create WebSocket connection
        guard let url = URL(string: config.websocketUrl + "/socket/peer/websocket") else {
            sdkLogger.error("\(logger): Invalid WebSocket URL")
            return
        }
        
        var request = URLRequest(url: url )
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
        let capturer = BroadcastScreenShareCapturer(videoSource: videoSource)
        
        sdkLogger.info("\(logger): Screen share track created and added")
        return capturer
    }
    
    /// Stops screen sharing and disconnects
    public func disconnect() {
        webSocket?.disconnect()
        peerConnectionManager.close()
        videoSource = nil
        videoTrack = nil
        localTrack = nil
        isAuthenticated = false
        isConnected = false
        sdkLogger.info("\(logger): Disconnected")
    }
    
    // MARK: - Private Helpers
    
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
            
        case .error(let error):
            sdkLogger.error("\(logger): WebSocket error: \(error?.localizedDescription ?? "unknown")")
            
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

// MARK: - Simple Frame Capturer

/// A simple capturer that converts RPBroadcast sample buffers to WebRTC video frames
public class BroadcastScreenShareCapturer {
    private let videoSource: RTCVideoSource
    
    init(videoSource: RTCVideoSource) {
        self.videoSource = videoSource
    }
    
    /// Processes a sample buffer from the broadcast extension
    /// Call this from `processSampleBuffer(_:with:)` in your RPBroadcastSampleHandler
    public func processSampleBuffer(_ sampleBuffer: CMSampleBuffer, with sampleBufferType: RPSampleBufferType) {
        guard sampleBufferType == .video else { return }
        guard sampleBuffer.isValid else { return }
        
        guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else {
            return
        }
        
        let height = Int32(CVPixelBufferGetHeight(pixelBuffer))
        let width = Int32(CVPixelBufferGetWidth(pixelBuffer))
        
        let rtcBuffer = RTCCVPixelBuffer(
            pixelBuffer: pixelBuffer,
            adaptedWidth: width,
            adaptedHeight: height,
            cropWidth: width,
            cropHeight: height,
            cropX: 0,
            cropY: 0
        )
        
        let buffer = rtcBuffer.toI420()
        let videoFrame = RTCVideoFrame(
            buffer: buffer,
            rotation: ._0,
            timeStampNs: sampleBuffer.presentationTimeStamp.value
        )
        
        let delegate = videoSource as RTCVideoCapturerDelegate
        delegate.capturer(RTCVideoCapturer(delegate: videoSource), didCapture: videoFrame)
    }
}

