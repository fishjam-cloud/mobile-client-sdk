import AVKit
import Accelerate
import Foundation
import SwiftUI
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
            splitScreenViewModel.primaryPlaceholderText = primaryPlaceholderText
        }
    }

    public var secondaryPlaceholderText: String = "No active speaker" {
        didSet {
            splitScreenViewModel.secondaryPlaceholderText = secondaryPlaceholderText
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
    private var splitScreenHostingController: UIHostingController<SplitScreenView>?
    private let splitScreenViewModel: SplitScreenViewModel

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

        self.primaryPlaceholderText = primaryPlaceholder
        self.secondaryPlaceholderText = secondaryPlaceholder
        
        self.splitScreenViewModel = SplitScreenViewModel(
            primaryPlaceholderText: primaryPlaceholder,
            secondaryPlaceholderText: secondaryPlaceholder
        )

        super.init()

        setupPictureInPicture()
        setupNotifications()
    }

    deinit {
        cleanup()
    }

    private func setupPictureInPicture() {
        guard let sourceView else { return }

        pipCallViewController = AVPictureInPictureVideoCallViewController()
        pipCallViewController?.preferredContentSize = CGSize(width: 1920, height: 1080)

        guard let pipCallViewController else { return }

        setupSplitScreenLayout()

        contentSource = AVPictureInPictureController.ContentSource(
            activeVideoCallSourceView: sourceView,
            contentViewController: pipCallViewController
        )

        guard let contentSource else { return }

        pipController = AVPictureInPictureController(contentSource: contentSource)

        pipController?.delegate = self
    }

    private func setupSplitScreenLayout() {
        guard let pipCallViewController else { return }
        
        let splitScreenView = SplitScreenView(
            primarySampleView: primarySampleView,
            secondarySampleView: secondarySampleView,
            viewModel: splitScreenViewModel
        )
        
        splitScreenHostingController = UIHostingController(rootView: splitScreenView)
        
        guard let splitScreenHostingController else { return }
        
        splitScreenHostingController.view.translatesAutoresizingMaskIntoConstraints = false
        splitScreenHostingController.view.backgroundColor = .black
        
        pipCallViewController.addChild(splitScreenHostingController)
        pipCallViewController.view.addSubview(splitScreenHostingController.view)
        splitScreenHostingController.didMove(toParent: pipCallViewController)
        
        NSLayoutConstraint.activate([
            splitScreenHostingController.view.leadingAnchor.constraint(equalTo: pipCallViewController.view.leadingAnchor),
            splitScreenHostingController.view.trailingAnchor.constraint(equalTo: pipCallViewController.view.trailingAnchor),
            splitScreenHostingController.view.topAnchor.constraint(equalTo: pipCallViewController.view.topAnchor),
            splitScreenHostingController.view.bottomAnchor.constraint(equalTo: pipCallViewController.view.bottomAnchor)
        ])
        
//        primarySampleView.isHidden = true
//        secondarySampleView.isHidden = true
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
        if let oldTrack {
            oldTrack.remove(primarySampleView)
        }

        if let newTrack = newTrack {
            newTrack.add(primarySampleView)
            primarySampleView.isHidden = false
            splitScreenViewModel.isPrimaryVideoVisible = true
        } else {
            primarySampleView.isHidden = true
            splitScreenViewModel.isPrimaryVideoVisible = false
        }
    }

    private func handleSecondaryVideoTrackChange(from oldTrack: RTCVideoTrack?, to newTrack: RTCVideoTrack?) {
        if let oldTrack = oldTrack {
            oldTrack.remove(secondarySampleView)
        }

        if let newTrack = newTrack {
            newTrack.add(secondarySampleView)
            secondarySampleView.isHidden = false
            splitScreenViewModel.isSecondaryVideoVisible = true
        } else {
            secondarySampleView.isHidden = true
            splitScreenViewModel.isSecondaryVideoVisible = false
        }
    }

    public func updateSecondaryTrack(trackInfo: RemoteTrackInfo?) {
        if let oldTrack = secondaryVideoTrack {
            oldTrack.remove(secondarySampleView)
            secondaryVideoTrack = nil
            splitScreenViewModel.isSecondaryVideoVisible = false
            splitScreenViewModel.secondaryPlaceholderText = "No active speaker"
        }

        guard let trackInfo else {
            secondarySampleView.isHidden = true
            splitScreenViewModel.isSecondaryVideoVisible = false
            return
        }
        splitScreenViewModel.secondaryPlaceholderText = trackInfo.displayName ?? "Peer"
        
        if trackInfo.hasVideoTrack, let videoTrack = trackInfo.videoTrack {
            secondaryVideoTrack = videoTrack
            videoTrack.add(secondarySampleView)
            secondarySampleView.isHidden = false
            splitScreenViewModel.isSecondaryVideoVisible = true
        } else {
            secondarySampleView.isHidden = true
            splitScreenViewModel.isSecondaryVideoVisible = false
        }
    }

    private func cleanup() {
        primaryVideoTrack?.remove(primarySampleView)
        secondaryVideoTrack?.remove(secondarySampleView)
    }

    @objc private func applicationWillEnterForeground(_ notification: Notification) {
        if stopAutomatically {
            UIView.animate(withDuration: 0.5) {
                self.splitScreenViewModel.isPrimaryVideoVisible = false
                self.splitScreenViewModel.isSecondaryVideoVisible = false
                self.splitScreenHostingController?.view.isHidden = true
            }

            // Arbitraty 0.5s, if called too early won't have any effect.
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
        UIView.animate(withDuration: 0.5) { [self] in
            self.primarySampleView.shouldRender = true
            self.secondarySampleView.shouldRender = true
            self.splitScreenViewModel.isPrimaryVideoVisible = self.primaryVideoTrack?.isEnabled ?? false
            self.splitScreenViewModel.isSecondaryVideoVisible = self.secondaryVideoTrack?.isEnabled ?? false
            self.splitScreenHostingController?.view.isHidden = false
        }
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
