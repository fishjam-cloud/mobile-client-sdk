import AVKit
import FishjamCloudClient
import WebRTC

@MainActor
class PictureInPictureManager {
    private let sourceView: UIView
    private let eventEmitter: (EmitableEvent) -> Void
    private weak var fishjamClient: FishjamClient?
    
    private var controller: PictureInPictureController?
    
    private var startAutomatically: Bool {
        didSet {
            controller?.startAutomatically = startAutomatically
        }
    }
    
    private var stopAutomatically: Bool {
        didSet {
            controller?.stopAutomatically = stopAutomatically
        }
    }
    
    var primaryPlaceholderText: String = "No camera" {
        didSet {
            controller?.primaryPlaceholderText = primaryPlaceholderText
        }
    }
    
    var secondaryPlaceholderText: String = "No active speaker" {
        didSet {
            controller?.secondaryPlaceholderText = secondaryPlaceholderText
        }
    }

    init(
        sourceView: UIView,
        eventEmitter: @escaping (EmitableEvent) -> Void,
        fishjamClient: FishjamClient?
    ) {
        self.sourceView = sourceView
        self.eventEmitter = eventEmitter
        self.fishjamClient = fishjamClient
        self.startAutomatically = true
        self.stopAutomatically = true
        
        RNFishjamClient.tracksUpdateListenersManager.add(self)
    }
    
    deinit {
        RNFishjamClient.tracksUpdateListenersManager.remove(self)
    }
    
    @discardableResult
    private func ensureController() -> PictureInPictureController? {
        if controller == nil {
            let newController = PictureInPictureController(
                sourceView: sourceView,
                primaryPlaceholder: primaryPlaceholderText,
                secondaryPlaceholder: secondaryPlaceholderText
            )
            newController.startAutomatically = startAutomatically
            newController.stopAutomatically = stopAutomatically
            controller = newController
            
            updateTracks()
        }
        return controller
    }
    
    private func findLocalCameraTrack() -> RTCVideoTrack? {
        guard let fishjamClient = fishjamClient else { return nil }
        
        let localEndpoint = fishjamClient.getLocalEndpoint()
        
        for (_, track) in localEndpoint.tracks {
            if let videoTrack = track as? LocalVideoTrack,
               let metadata = track.metadata.toDict() as? [String: Any],
               metadata["type"] as? String == "camera" {
                return videoTrack.mediaTrack as? RTCVideoTrack
            }
        }
        
        return nil
    }
    
    private func findRemoteVadActiveTrack() -> RemoteTrackInfo? {
        guard let fishjamClient = fishjamClient else { return nil }
        
        let remoteEndpoints = fishjamClient.getRemoteEndpoints()
        
        // First pass: look for active VAD
        for endpoint in remoteEndpoints {
            // Check if this endpoint has an active VAD audio track
            let hasActiveVad = endpoint.tracks.values.contains { track in
                if let audioTrack = track as? RemoteAudioTrack {
                    return audioTrack.vadStatus == .speech
                }
                return false
            }
            
            if hasActiveVad {
                let videoTrack = endpoint.tracks.values.first { track in
                    track is RemoteVideoTrack
                } as? RemoteVideoTrack
                
                let metadataDict = endpoint.metadata.toDict()
                let displayName = (metadataDict["displayName"] as? String) ??
                                 (metadataDict["name"] as? String) ??
                                 endpoint.id
                
                return RemoteTrackInfo(
                    videoTrack: videoTrack?.mediaTrack as? RTCVideoTrack,
                    displayName: displayName,
                    hasVideoTrack: videoTrack != nil
                )
            }
        }
        
        // Fallback: return first available remote peer with video track
        for endpoint in remoteEndpoints {
            if let videoTrack = endpoint.tracks.values.first(where: { $0 is RemoteVideoTrack }) as? RemoteVideoTrack {
                let metadataDict = endpoint.metadata.toDict()
                let displayName = (metadataDict["displayName"] as? String) ??
                                 (metadataDict["name"] as? String) ??
                                 endpoint.id
                
                return RemoteTrackInfo(
                    videoTrack: videoTrack.mediaTrack as? RTCVideoTrack,
                    displayName: displayName,
                    hasVideoTrack: true
                )
            }
        }
        
        return nil
    }
    
    private func updateTracks() {
        guard let pipController = controller else { return }
        
        let localCameraTrack = findLocalCameraTrack()
        let remoteTrackInfo = findRemoteVadActiveTrack()
        
        pipController.primaryVideoTrack = localCameraTrack
        pipController.updateSecondaryTrack(trackInfo: remoteTrackInfo)
    }
    

    
    private func emitWarning(_ message: String) {
        eventEmitter(.warning(message: message))
    }
    
    
    func start() {
        _ = ensureController()
        controller?.startPictureInPicture()
    }
    
    func stop() {
        controller?.stopPictureInPicture()
    }
    
    func setAllowsCameraWhileInPictureInPicture(_ enabled: Bool) {
        guard let fishjamClient = fishjamClient else {
            emitWarning("PictureInPicture: Fishjam client not available")
            return
        }
        
        let localEndpoint = fishjamClient.getLocalEndpoint()
        guard let cameraTrack = localEndpoint.tracks.compactMap({ $0.value as? LocalCameraTrack }).first else {
            emitWarning("PictureInPicture: Unable to configure background camera - camera not initialized")
            return
        }

        let success = cameraTrack.setMultitaskingCameraAccessEnabled(enabled)
        if !success {
            emitWarning("PictureInPicture: Background camera access requires iOS 16.0 or later and must be supported by the device")
        }
    }
    
    func setStartAutomatically(_ enabled: Bool) {
        if enabled {
            ensureController()
        }
        startAutomatically = enabled
        controller?.startAutomatically = enabled
    }
    
    func setStopAutomatically(_ enabled: Bool) {
        stopAutomatically = enabled
        controller?.stopAutomatically = enabled
    }
    
    func cleanup() {
        controller?.stopPictureInPicture()
        controller = nil
    }
}

extension PictureInPictureManager: TrackUpdateListener {
    nonisolated func onTracksUpdate() {
        Task { @MainActor in
            updateTracks()
        }
    }
}
