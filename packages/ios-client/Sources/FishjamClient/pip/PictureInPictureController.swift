/*
* Adapted from Objective-C version: https://github.com/react-native-webrtc/react-native-webrtc/blob/a388aba77d6ef652d904ac4ef55026716bb151f1/ios/RCTWebRTC/PIPController.m
 */

import AVKit
import Accelerate
import Foundation
import UIKit
import WebRTC

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

    public init(sourceView: UIView, primaryPlaceholder: String = "No camera", secondaryPlaceholder: String = "No active speaker") {
        self.sourceView = sourceView
        
        // Create sample views
        self.primarySampleView = SampleBufferVideoCallView(frame: .zero)
        self.primarySampleView.translatesAutoresizingMaskIntoConstraints = false
        
        self.secondarySampleView = SampleBufferVideoCallView(frame: .zero)
        self.secondarySampleView.translatesAutoresizingMaskIntoConstraints = false
        
        // Create placeholder labels
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
        
        // Create split screen container
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

        // Setup split screen layout
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
        
        // Create containers for each side
        let primaryContainer = UIView()
        primaryContainer.translatesAutoresizingMaskIntoConstraints = false
        
        let secondaryContainer = UIView()
        secondaryContainer.translatesAutoresizingMaskIntoConstraints = false
        
        // Add placeholders to containers
        primaryContainer.addSubview(primaryPlaceholderLabel)
        secondaryContainer.addSubview(secondaryPlaceholderLabel)
        
        // Add video views on top of placeholders
        primaryContainer.addSubview(primarySampleView)
        secondaryContainer.addSubview(secondarySampleView)
        
        // Add containers to split screen
        splitScreenContainer.addArrangedSubview(primaryContainer)
        splitScreenContainer.addArrangedSubview(secondaryContainer)
        
        // Add split screen to PiP view controller
        pipCallViewController.view.addSubview(splitScreenContainer)
        
        // Setup constraints
        NSLayoutConstraint.activate([
            // Split screen fills the entire PiP view
            splitScreenContainer.leadingAnchor.constraint(equalTo: pipCallViewController.view.leadingAnchor),
            splitScreenContainer.trailingAnchor.constraint(equalTo: pipCallViewController.view.trailingAnchor),
            splitScreenContainer.topAnchor.constraint(equalTo: pipCallViewController.view.topAnchor),
            splitScreenContainer.bottomAnchor.constraint(equalTo: pipCallViewController.view.bottomAnchor),
            
            // Primary placeholder fills its container
            primaryPlaceholderLabel.leadingAnchor.constraint(equalTo: primaryContainer.leadingAnchor),
            primaryPlaceholderLabel.trailingAnchor.constraint(equalTo: primaryContainer.trailingAnchor),
            primaryPlaceholderLabel.topAnchor.constraint(equalTo: primaryContainer.topAnchor),
            primaryPlaceholderLabel.bottomAnchor.constraint(equalTo: primaryContainer.bottomAnchor),
            
            // Secondary placeholder fills its container
            secondaryPlaceholderLabel.leadingAnchor.constraint(equalTo: secondaryContainer.leadingAnchor),
            secondaryPlaceholderLabel.trailingAnchor.constraint(equalTo: secondaryContainer.trailingAnchor),
            secondaryPlaceholderLabel.topAnchor.constraint(equalTo: secondaryContainer.topAnchor),
            secondaryPlaceholderLabel.bottomAnchor.constraint(equalTo: secondaryContainer.bottomAnchor),
            
            // Primary sample view fills its container
            primarySampleView.leadingAnchor.constraint(equalTo: primaryContainer.leadingAnchor),
            primarySampleView.trailingAnchor.constraint(equalTo: primaryContainer.trailingAnchor),
            primarySampleView.topAnchor.constraint(equalTo: primaryContainer.topAnchor),
            primarySampleView.bottomAnchor.constraint(equalTo: primaryContainer.bottomAnchor),
            
            // Secondary sample view fills its container
            secondarySampleView.leadingAnchor.constraint(equalTo: secondaryContainer.leadingAnchor),
            secondarySampleView.trailingAnchor.constraint(equalTo: secondaryContainer.trailingAnchor),
            secondarySampleView.topAnchor.constraint(equalTo: secondaryContainer.topAnchor),
            secondarySampleView.bottomAnchor.constraint(equalTo: secondaryContainer.bottomAnchor),
        ])
        
        // Initially hide video views (show placeholders)
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
    
    public func pictureInPictureController(_ pictureInPictureController: AVPictureInPictureController, failedToStartPictureInPictureWithError error: any Error) {
        print(error.localizedDescription)
    }
    
    public func pictureInPictureControllerWillStartPictureInPicture(_ pictureInPictureController: AVPictureInPictureController) {
        primarySampleView.layer.opacity = 1
        primarySampleView.shouldRender = true
        secondarySampleView.layer.opacity = 1
        secondarySampleView.shouldRender = true
    }
    
    public func pictureInPictureControllerDidStopPictureInPicture(_ pictureInPictureController: AVPictureInPictureController) {
        primarySampleView.shouldRender = false
        secondarySampleView.shouldRender = false
    }
    
    public func pictureInPictureController(_ pictureInPictureController: AVPictureInPictureController, restoreUserInterfaceForPictureInPictureStopWithCompletionHandler completionHandler: @escaping (Bool) -> Void) {
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
