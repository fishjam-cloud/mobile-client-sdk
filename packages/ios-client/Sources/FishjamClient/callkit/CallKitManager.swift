import CallKit
import AVFoundation
import Logging

/// Manager for handling CallKit integration
/// This enables proper iOS call handling and keeps the app active during calls
@available(iOS 10.0, *)
public class CallKitManager: NSObject {
    private let logger = Logger(label: "org.fishjam.CallKitManager")
    
    private let callController = CXCallController()
    private let provider: CXProvider
    private var currentCallUUID: UUID?
    private var isCallActive = false
    
    public var onCallEnded: (() -> Void)?
    public var onCallAnswered: (() -> Void)?
    
    /// Initialize CallKit manager with configuration
    /// - Parameter localizedCallerName: The name to display for the caller (e.g., app name or room name)
    public init(localizedCallerName: String = "Fishjam") {
        let providerConfiguration = CXProviderConfiguration()
        providerConfiguration.supportsVideo = true
        providerConfiguration.supportedHandleTypes = [.generic]
        providerConfiguration.maximumCallsPerCallGroup = 1
        providerConfiguration.maximumCallGroups = 1
        
        // Configure audio session for the call
        providerConfiguration.includesCallsInRecents = false
        
        provider = CXProvider(configuration: providerConfiguration)
        
        super.init()
        
        provider.setDelegate(self, queue: nil)
    }
    
    /// Start a new call with CallKit
    /// - Parameters:
    ///   - handle: A unique identifier for the call (e.g., room name or peer ID)
    ///   - displayName: The name to display in the CallKit UI
    /// - Throws: CallKit errors if the call cannot be started
    public func startCall(handle: String, displayName: String = "Fishjam Call") throws {
        guard currentCallUUID == nil else {
            logger.warning("Call already in progress")
            return
        }
        
        let uuid = UUID()
        currentCallUUID = uuid
        
        let handle = CXHandle(type: .generic, value: handle)
        let startCallAction = CXStartCallAction(call: uuid, handle: handle)
        startCallAction.isVideo = true
        startCallAction.contactIdentifier = displayName
        
        let transaction = CXTransaction(action: startCallAction)
        
        callController.request(transaction) { [weak self] error in
            if let error = error {
                self?.logger.error("Failed to start call: \(error.localizedDescription)")
                self?.currentCallUUID = nil
            } else {
                self?.logger.info("Call started successfully")
                self?.isCallActive = true
                
                // Report the call to the provider so it shows in the UI
                self?.provider.reportOutgoingCall(with: uuid, startedConnectingAt: Date())
                self?.provider.reportOutgoingCall(with: uuid, connectedAt: Date())
            }
        }
    }
    
    /// End the current call
    public func endCall() {
        guard let uuid = currentCallUUID else {
            logger.warning("No active call to end")
            return
        }
        
        let endCallAction = CXEndCallAction(call: uuid)
        let transaction = CXTransaction(action: endCallAction)
        
        callController.request(transaction) { [weak self] error in
            if let error = error {
                self?.logger.error("Failed to end call: \(error.localizedDescription)")
            } else {
                self?.logger.info("Call ended successfully")
            }
            self?.cleanup()
        }
    }
    
    /// Update the active call's audio session
    public func configureAudioSession() {
        let audioSession = AVAudioSession.sharedInstance()
        do {
            try audioSession.setCategory(.playAndRecord, mode: .voiceChat, options: [.allowBluetooth, .allowBluetoothA2DP])
            try audioSession.setActive(true)
            logger.info("Audio session configured for call")
        } catch {
            logger.error("Failed to configure audio session: \(error.localizedDescription)")
        }
    }
    
    /// Check if there is an active call
    public var hasActiveCall: Bool {
        return currentCallUUID != nil && isCallActive
    }
    
    private func cleanup() {
        currentCallUUID = nil
        isCallActive = false
    }
}

// MARK: - CXProviderDelegate
@available(iOS 10.0, *)
extension CallKitManager: CXProviderDelegate {
    public func providerDidReset(_ provider: CXProvider) {
        logger.info("Provider did reset")
        cleanup()
    }
    
    public func provider(_ provider: CXProvider, perform action: CXStartCallAction) {
        configureAudioSession()
        action.fulfill()
    }
    
    public func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
        logger.info("Call ended by user")
        onCallEnded?()
        action.fulfill()
        cleanup()
    }
    
    public func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
        logger.info("Call answered by user")
        configureAudioSession()
        onCallAnswered?()
        action.fulfill()
    }
    
    public func provider(_ provider: CXProvider, perform action: CXSetHeldCallAction) {
        // Handle call hold/unhold
        action.fulfill()
    }
    
    public func provider(_ provider: CXProvider, perform action: CXSetMutedCallAction) {
        // Handle mute/unmute
        action.fulfill()
    }
    
    public func provider(_ provider: CXProvider, didActivate audioSession: AVAudioSession) {
        logger.info("Audio session activated")
    }
    
    public func provider(_ provider: CXProvider, didDeactivate audioSession: AVAudioSession) {
        logger.info("Audio session deactivated")
    }
}

