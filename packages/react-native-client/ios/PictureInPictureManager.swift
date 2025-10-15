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
    }
    
    private func ensureController() -> PictureInPictureController? {
        if controller == nil {
            let newController = PictureInPictureController(sourceView: sourceView)
            newController.startAutomatically = startAutomatically
            newController.stopAutomatically = stopAutomatically
            controller = newController
        }
        return controller
    }
    
    private func emitWarning(_ message: String) {
        eventEmitter(.warning(message: message))
    }
    
    func setPipActive(trackId: String) {
        guard let pipController = ensureController() else {
            emitWarning("PictureInPicture: Unable to initialize PiP controller - no key window found")
            return
        }
        
        guard let fishjamClient = fishjamClient else {
            emitWarning("PictureInPicture: Fishjam client not available")
            return
        }
        
        let localEndpoint = fishjamClient.getLocalEndpoint()
        let remoteEndpoints = fishjamClient.getRemoteEndpoints()
        let allEndpoints = [localEndpoint] + remoteEndpoints
        
        guard let track = allEndpoints.first(where: { ep in
            ep.tracks[trackId] != nil
        })?.tracks[trackId], let videoTrack = track.mediaTrack as? RTCVideoTrack else {
            emitWarning("PictureInPicture: Track with id \(trackId) not found")
            return
        }
        
        guard pipController.videoTrack != videoTrack else { return }
        
        pipController.videoTrack = videoTrack
    }
    
    func start() {
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

