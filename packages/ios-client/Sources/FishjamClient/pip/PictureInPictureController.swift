import AVKit
import Accelerate
import Foundation
import UIKit
import WebRTC

public struct RemoteTrackInfo {
    let videoTrack: RTCVideoTrack?
    let displayName: String?
    let hasVideoTrack: Bool

    public init(videoTrack: RTCVideoTrack?, displayName: String?, hasVideoTrack: Bool) {
        self.videoTrack = videoTrack
        self.displayName = displayName
        self.hasVideoTrack = hasVideoTrack
    }
}

public class PictureInPictureController: NSObject, AVPictureInPictureControllerDelegate {
    public weak var sourceView: UIView?

    public var primaryVideoTrack: RTCVideoTrack? {
        didSet {
            handlePrimaryVideoTrackChange(from: oldValue, to: primaryVideoTrack)
        }
    }

    public var secondaryVideoTrack: RTCVideoTrack? {
        didSet {
            handleSecondaryVideoTrackChange(from: oldValue, to: secondaryVideoTrack)
        }
    }

    public var primaryPlaceholderText: String = "No camera" {
        didSet {
            primaryPlaceholderLabel.text = primaryPlaceholderText
        }
    }

    public var secondaryPlaceholderText: String = "No active speaker" {
        didSet {
            secondaryPlaceholderLabel.text = secondaryPlaceholderText
        }
    }

    public var startAutomatically: Bool {
        get { pipController?.canStartPictureInPictureAutomaticallyFromInline ?? false }
        set { pipController?.canStartPictureInPictureAutomaticallyFromInline = newValue }
    }

    public var stopAutomatically: Bool = true

    private var pipCallViewController: AVPictureInPictureVideoCallViewController?
    private var contentSource: AVPictureInPictureController.ContentSource?
    private var pipController: AVPictureInPictureController?
    private let primarySampleView: SampleBufferVideoCallView
    private let secondarySampleView: SampleBufferVideoCallView
    private let primaryPlaceholderLabel: UILabel
    private let secondaryPlaceholderLabel: UILabel
    private let splitScreenContainer: UIStackView
    private var secondaryContainer: UIView?

    public init(
        sourceView: UIView,
        primaryPlaceholder: String = "No camera",
        secondaryPlaceholder: String = "No active speaker"
    ) {
        self.sourceView = sourceView

        self.primarySampleView = SampleBufferVideoCallView(frame: .zero)
        self.primarySampleView.translatesAutoresizingMaskIntoConstraints = false

        self.secondarySampleView = SampleBufferVideoCallView(frame: .zero)
        self.secondarySampleView.translatesAutoresizingMaskIntoConstraints = false

        self.primaryPlaceholderLabel = UILabel()
        self.primaryPlaceholderLabel.text = primaryPlaceholder
        self.primaryPlaceholderLabel.textAlignment = .center
        self.primaryPlaceholderLabel.textColor = .white
        self.primaryPlaceholderLabel.backgroundColor = UIColor(red: 0.38, green: 0.38, blue: 0.38, alpha: 1.0)
        self.primaryPlaceholderLabel.translatesAutoresizingMaskIntoConstraints = false

        self.secondaryPlaceholderLabel = UILabel()
        self.secondaryPlaceholderLabel.text = secondaryPlaceholder
        self.secondaryPlaceholderLabel.textAlignment = .center
        self.secondaryPlaceholderLabel.textColor = .white
        self.secondaryPlaceholderLabel.backgroundColor = UIColor(red: 0.38, green: 0.38, blue: 0.38, alpha: 1.0)
        self.secondaryPlaceholderLabel.translatesAutoresizingMaskIntoConstraints = false

        self.primaryPlaceholderText = primaryPlaceholder
        self.secondaryPlaceholderText = secondaryPlaceholder

        self.splitScreenContainer = UIStackView()
        self.splitScreenContainer.axis = .horizontal
        self.splitScreenContainer.distribution = .fillEqually
        self.splitScreenContainer.translatesAutoresizingMaskIntoConstraints = false

        super.init()

        setupPictureInPicture()
        setupNotifications()
    }

    deinit {
        cleanup()
    }

    private func setupPictureInPicture() {
        guard let sourceView = sourceView else { return }

        pipCallViewController = AVPictureInPictureVideoCallViewController()
        pipCallViewController?.preferredContentSize = CGSize(width: 1920, height: 1080)

        guard let pipCallViewController = pipCallViewController else { return }

        setupSplitScreenLayout()

        contentSource = AVPictureInPictureController.ContentSource(
            activeVideoCallSourceView: sourceView,
            contentViewController: pipCallViewController
        )

        guard let contentSource = contentSource else { return }

        pipController = AVPictureInPictureController(contentSource: contentSource)

        pipController?.delegate = self
    }

    private func setupSplitScreenLayout() {
        guard let pipCallViewController = pipCallViewController else { return }

        let primaryContainer = UIView()
        primaryContainer.translatesAutoresizingMaskIntoConstraints = false

        let secondaryContainerView = UIView()
        secondaryContainerView.translatesAutoresizingMaskIntoConstraints = false
        self.secondaryContainer = secondaryContainerView

        primaryContainer.addSubview(primaryPlaceholderLabel)
        secondaryContainerView.addSubview(secondaryPlaceholderLabel)

        primaryContainer.addSubview(primarySampleView)
        secondaryContainerView.addSubview(secondarySampleView)

        splitScreenContainer.addArrangedSubview(primaryContainer)
        splitScreenContainer.addArrangedSubview(secondaryContainerView)

        pipCallViewController.view.addSubview(splitScreenContainer)

        NSLayoutConstraint.activate([
            splitScreenContainer.leadingAnchor.constraint(equalTo: pipCallViewController.view.leadingAnchor),
            splitScreenContainer.trailingAnchor.constraint(equalTo: pipCallViewController.view.trailingAnchor),
            splitScreenContainer.topAnchor.constraint(equalTo: pipCallViewController.view.topAnchor),
            splitScreenContainer.bottomAnchor.constraint(equalTo: pipCallViewController.view.bottomAnchor),

            primaryPlaceholderLabel.leadingAnchor.constraint(equalTo: primaryContainer.leadingAnchor),
            primaryPlaceholderLabel.trailingAnchor.constraint(equalTo: primaryContainer.trailingAnchor),
            primaryPlaceholderLabel.topAnchor.constraint(equalTo: primaryContainer.topAnchor),
            primaryPlaceholderLabel.bottomAnchor.constraint(equalTo: primaryContainer.bottomAnchor),

            secondaryPlaceholderLabel.leadingAnchor.constraint(equalTo: secondaryContainerView.leadingAnchor),
            secondaryPlaceholderLabel.trailingAnchor.constraint(equalTo: secondaryContainerView.trailingAnchor),
            secondaryPlaceholderLabel.topAnchor.constraint(equalTo: secondaryContainerView.topAnchor),
            secondaryPlaceholderLabel.bottomAnchor.constraint(equalTo: secondaryContainerView.bottomAnchor),

            primarySampleView.leadingAnchor.constraint(equalTo: primaryContainer.leadingAnchor),
            primarySampleView.trailingAnchor.constraint(equalTo: primaryContainer.trailingAnchor),
            primarySampleView.topAnchor.constraint(equalTo: primaryContainer.topAnchor),
            primarySampleView.bottomAnchor.constraint(equalTo: primaryContainer.bottomAnchor),

            secondarySampleView.leadingAnchor.constraint(equalTo: secondaryContainerView.leadingAnchor),
            secondarySampleView.trailingAnchor.constraint(equalTo: secondaryContainerView.trailingAnchor),
            secondarySampleView.topAnchor.constraint(equalTo: secondaryContainerView.topAnchor),
            secondarySampleView.bottomAnchor.constraint(equalTo: secondaryContainerView.bottomAnchor),
        ])

        primarySampleView.isHidden = true
        secondarySampleView.isHidden = true
    }

    private func setupNotifications() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(applicationWillEnterForeground),
            name: UIApplication.willEnterForegroundNotification,
            object: nil
        )
    }

    private func handlePrimaryVideoTrackChange(from oldTrack: RTCVideoTrack?, to newTrack: RTCVideoTrack?) {
        if let oldTrack = oldTrack {
            oldTrack.remove(primarySampleView)
        }

        if let newTrack = newTrack {
            newTrack.add(primarySampleView)
            primarySampleView.isHidden = false
            primaryPlaceholderLabel.isHidden = true
        } else {
            primarySampleView.isHidden = true
            primaryPlaceholderLabel.isHidden = false
        }
    }

    private func handleSecondaryVideoTrackChange(from oldTrack: RTCVideoTrack?, to newTrack: RTCVideoTrack?) {
        if let oldTrack = oldTrack {
            oldTrack.remove(secondarySampleView)
        }

        if let newTrack = newTrack {
            newTrack.add(secondarySampleView)
            secondarySampleView.isHidden = false
            secondaryPlaceholderLabel.isHidden = true
        } else {
            secondarySampleView.isHidden = true
            secondaryPlaceholderLabel.isHidden = false
        }
    }

    public func updateSecondaryTrack(trackInfo: RemoteTrackInfo?) {
        if let oldTrack = secondaryVideoTrack {
            oldTrack.remove(secondarySampleView)
            secondaryVideoTrack = nil
        }

        guard let trackInfo = trackInfo else {
            secondarySampleView.isHidden = true
            secondaryPlaceholderLabel.isHidden = true
            secondaryContainer?.isHidden = true
            return
        }

        if trackInfo.hasVideoTrack, let videoTrack = trackInfo.videoTrack {
            secondaryVideoTrack = videoTrack
            videoTrack.add(secondarySampleView)
            secondarySampleView.isHidden = false
            secondaryPlaceholderLabel.isHidden = true
            secondaryContainer?.isHidden = false
        } else {
            secondarySampleView.isHidden = true
            secondaryPlaceholderLabel.text = trackInfo.displayName
            secondaryPlaceholderLabel.isHidden = false
            secondaryContainer?.isHidden = false
        }
    }

    private func cleanup() {
        primaryVideoTrack?.remove(primarySampleView)
        secondaryVideoTrack?.remove(secondarySampleView)
    }

    @objc private func applicationWillEnterForeground(_ notification: Notification) {
        if stopAutomatically {
            UIView.animate(withDuration: 0.5) {
                self.primarySampleView.layer.opacity = 0
                self.secondarySampleView.layer.opacity = 0
            }

            // Arbitraty 0.5s, if called to early won't have any effect.
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                self.pipController?.stopPictureInPicture()
            }
        }
    }

    public func pictureInPictureController(
        _ pictureInPictureController: AVPictureInPictureController,
        failedToStartPictureInPictureWithError error: any Error
    ) {
        print(error.localizedDescription)
    }

    public func pictureInPictureControllerWillStartPictureInPicture(
        _ pictureInPictureController: AVPictureInPictureController
    ) {
        primarySampleView.layer.opacity = 1
        primarySampleView.shouldRender = true
        secondarySampleView.layer.opacity = 1
        secondarySampleView.shouldRender = true
    }

    public func pictureInPictureControllerDidStopPictureInPicture(
        _ pictureInPictureController: AVPictureInPictureController
    ) {
        primarySampleView.shouldRender = false
        secondarySampleView.shouldRender = false
    }

    public func pictureInPictureController(
        _ pictureInPictureController: AVPictureInPictureController,
        restoreUserInterfaceForPictureInPictureStopWithCompletionHandler completionHandler: @escaping (Bool) -> Void
    ) {
        completionHandler(true)
    }

    public func startPictureInPicture() {
        guard let pipController = pipController,
            pipController.isPictureInPicturePossible
        else { return }

        pipController.startPictureInPicture()
    }

    public func stopPictureInPicture() {
        guard let pipController = pipController,
            pipController.isPictureInPictureActive
        else { return }

        pipController.stopPictureInPicture()
    }
}
