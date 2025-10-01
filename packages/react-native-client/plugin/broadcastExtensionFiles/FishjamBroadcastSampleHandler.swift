import FishjamCloudClient
import Foundation
import ReplayKit
import os.log

/// App Group used by the extension to exchange configuration with the target application
let appGroup = "{{GROUP_IDENTIFIER}}"

let logger = OSLog(subsystem: "{{BUNDLE_IDENTIFIER}}.FishjamBroadcastSampleHandler", category: "Broadcaster")

/// Sample handler for iOS Broadcast Upload Extension using the minimal BroadcastExtensionClient
///
/// This implementation:
/// 1. Loads connection configuration from the main app via App Groups
/// 2. Creates a minimal WebRTC connection directly from the extension
/// 3. Sends screen share frames without using IPC to the main app
class FishjamBroadcastSampleHandler: RPBroadcastSampleHandler, BroadcastExtensionClientDelegate {
    
    private var client: BroadcastExtensionClient?
    private var capturer: BroadcastScreenShareCapturer?
    
    override init() {
        super.init()
        os_log("FishjamBroadcastSampleHandler initialized", log: logger, type: .info)
    }

    override func broadcastStarted(withSetupInfo setupInfo: [String: NSObject]?) {
        os_log("Broadcast started", log: logger, type: .info)
        
        // Load configuration from App Group
        guard let config = BroadcastClient.loadBroadcastExtensionConfig(appGroup: appGroup) else {
            os_log("Failed to load broadcast extension config", log: logger, type: .error)
            let error = NSError(
                domain: "FishjamBroadcastSampleHandler",
                code: 1,
                userInfo: [NSLocalizedDescriptionKey: "No configuration found. Make sure to save config from the main app."]
            )
            finishBroadcastWithError(error)
            return
        }
        
        os_log("Config loaded: connecting to %{public}@", log: logger, type: .info, config.websocketUrl)
        
        // Create and configure the client
        let client = BroadcastExtensionClient()
        client.delegate = self
        self.client = client
        
        // Connect to Fishjam server
        // The delegate will be notified when connection is ready
        client.connect(config: config)
    }
    
    // MARK: - BroadcastExtensionClientDelegate
    
    func broadcastClientDidConnect(_ client: BroadcastExtensionClient) {
        os_log("Broadcast client connected, starting screen share", log: logger, type: .info)
        
        if let capturer = client.startScreenShare() {
            self.capturer = capturer
            os_log("Screen share started successfully", log: logger, type: .info)
        } else {
            os_log("Failed to start screen share", log: logger, type: .error)
            let error = NSError(
                domain: "FishjamBroadcastSampleHandler",
                code: 2,
                userInfo: [NSLocalizedDescriptionKey: "Failed to start screen sharing"]
            )
            self.finishBroadcastWithError(error)
        }
    }

    override func broadcastPaused() {
        os_log("Broadcast paused", log: logger, type: .info)
        // You could pause frame sending here if needed
    }

    override func broadcastResumed() {
        os_log("Broadcast resumed", log: logger, type: .info)
        // Resume frame sending if paused
    }

    override func broadcastFinished() {
        os_log("Broadcast finished", log: logger, type: .info)
        client?.disconnect()
        client = nil
        capturer = nil
    }

    override func processSampleBuffer(_ sampleBuffer: CMSampleBuffer, with sampleBufferType: RPSampleBufferType) {
        // Only process video frames
        guard sampleBufferType == .video else { return }
        
        // Send frame to the capturer
        capturer?.processSampleBuffer(sampleBuffer, with: sampleBufferType)
    }
}
