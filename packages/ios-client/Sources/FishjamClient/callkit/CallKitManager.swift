import AVFoundation
import CallKit
import Logging

public class CallKitManager: NSObject {
    private let logger = Logger(label: "io.fishjam.CallKitManager")

    private let callController = CXCallController()
    private let provider: CXProvider
    private var currentCallUUID: UUID?

    public var onCallStarted: (() -> Void)?
    public var onCallFailed: ((String) -> Void)?
    public var onCallEnded: (() -> Void)?
    public var onCallHeld: ((Bool) -> Void)?
    public var onCallMuted: ((Bool) -> Void)?

    public override init() {
        let providerConfiguration = CXProviderConfiguration()
        providerConfiguration.supportsVideo = true
        providerConfiguration.supportedHandleTypes = [.generic]
        providerConfiguration.maximumCallsPerCallGroup = 1
        providerConfiguration.maximumCallGroups = 1

        providerConfiguration.includesCallsInRecents = false

        provider = CXProvider(configuration: providerConfiguration)

        super.init()

        provider.setDelegate(self, queue: nil)
    }

    public func startCallWith(displayName: String, isVideo: Bool) throws {
        guard currentCallUUID == nil else {
            logger.warning("Call already in progress")
            return
        }

        let uuid = UUID()
        currentCallUUID = uuid

        let handle = CXHandle(type: .generic, value: displayName)
        let startCallAction = CXStartCallAction(call: uuid, handle: handle)
        startCallAction.isVideo = isVideo
        startCallAction.contactIdentifier = displayName

        let transaction = CXTransaction(action: startCallAction)

        callController.request(transaction) { [weak self] error in
            guard let self else { return }
            if let error = error {
                self.logger.error("Failed to start call: \(error.localizedDescription)")
                self.currentCallUUID = nil
                self.onCallFailed?(error.localizedDescription)
                self.cleanup()
            } else {
                self.logger.info("Call started successfully")

                // Report the call to the provider so it shows in the UI
                self.provider.reportOutgoingCall(with: uuid, startedConnectingAt: Date())
                self.provider.reportOutgoingCall(with: uuid, connectedAt: Date())
                self.onCallStarted?()
            }
        }
    }

    public func endCall() {
        guard let uuid = currentCallUUID else {
            logger.warning("No active call to end")
            return
        }

        let transaction = CXTransaction(action: CXEndCallAction(call: uuid))

        callController.request(transaction) { [weak self] error in
            if let error = error {
                self?.logger.error("Failed to end call: \(error.localizedDescription)")
            } else {
                self?.logger.info("Call ended successfully")
                self?.onCallEnded?()
                self?.cleanup()
            }
        }
    }

    public var hasActiveCall: Bool {
        return currentCallUUID != nil
    }

    private func cleanup() {
        currentCallUUID = nil
    }
}

extension CallKitManager: CXProviderDelegate {
    public func providerDidReset(_ provider: CXProvider) {
        logger.info("Provider did reset")
        cleanup()
    }

    public func provider(_ provider: CXProvider, perform action: CXStartCallAction) {
        action.fulfill()
    }

    public func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
        onCallEnded?()
        action.fulfill()
        cleanup()
    }

    public func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
        action.fulfill()
    }

    public func provider(_ provider: CXProvider, perform action: CXSetHeldCallAction) {
        onCallHeld?(action.isOnHold)
        action.fulfill()
    }

    public func provider(_ provider: CXProvider, perform action: CXSetMutedCallAction) {
        onCallMuted?(action.isMuted)
        action.fulfill()
    }

    public func provider(_ provider: CXProvider, perform action: CXSetGroupCallAction) {
        action.fail()
    }
}
