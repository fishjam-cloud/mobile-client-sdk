import UIKit
import WebRTC

public protocol VideoViewDelegate: AnyObject {
    func didChange(dimensions: Dimensions)
}

/// `VideoView` is an instance of `UIVIew` that is  responsible for receiving a `RTCVideoTrack` that will
/// be then rendered inside the view.
///
/// It supports two types of fitting, `fit` and `fill` where the prior tries to keep the original dimensions
/// and the later one tries to fill the available space. Additionaly one can set mirror mode to flip the video horizontally,
/// usually expected when displaying the local user's view.
public class VideoView: UIView, VideoTrackDelegate {
    public enum Layout {
        case fit
        case fill
    }

    public var layout: Layout = .fill {
        didSet {
            guard oldValue != layout else { return }
            shouldLayout()
        }
    }

    public var mirror: Bool = false {
        didSet {
            guard oldValue != mirror else { return }
            update(mirror: mirror)
        }
    }

    /// If set to `nil` the view will always be rendered
    public var checkVisibilityTimeInterval: TimeInterval? {
        didSet {
            removeCheckVisibilityTimer()

            if checkVisibilityTimeInterval == nil {
                track?.videoTrack.shouldReceive = true
            } else {
                setupCheckVisibilityTimer()
            }
        }
    }

    /// usually should be equal to `frame.size`
    private var viewSize: CGSize

    private var checkVisibilityTimer: Timer?

    private var isVisibleOnScreen: Bool {
        guard !isEffectivelyHidden else { return false }
        let globalFrame = convert(frame, to: nil)
        return UIScreen.main.bounds.intersects(globalFrame)
    }

    override init(frame: CGRect) {
        viewSize = frame.size
        super.init(frame: frame)
    }

    @available(*, unavailable)
    required init?(coder _: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    public private(set) var rendererView: RTCMTLVideoView?

    /// When the track changes,a new renderer gets created and attached to the new track.
    /// To avoid leaking resources the old renderer gets removed from the old track.
    public var track: VideoTrack? {
        didSet {
            if let localCameraTrack = track as? LocalCameraTrack {
                localCameraTrack.mirrorVideo = { shouldMirror in
                    self.update(mirror: shouldMirror)
                }
            }
            if let oldValue = oldValue,
                let rendererView = rendererView
            {
                oldValue.removeRenderer(rendererView)
            }

            if let track = track {
                // create a new renderer view for the new track
                createAndPrepareRenderView()

                if let rendererView = rendererView {
                    track.addRenderer(rendererView)
                }
            }
            track?.delegate = self
            shouldLayout()
        }
    }

    public override func removeFromSuperview() {
        removeCheckVisibilityTimer()
        if let rendererView = rendererView {
            track?.removeRenderer(rendererView)
        }
        super.removeFromSuperview()
    }

    /// Delegate listening for the view's changes such as dimensions.
    public weak var delegate: VideoViewDelegate?

    /// In case of an old renderer view, it gets detached from the current view and a new instance
    /// gets created and then reattached.
    private func createAndPrepareRenderView() {
        if let view = rendererView {
            view.removeFromSuperview()
        }

        rendererView = VideoView.createNativeRendererView()
        if let view = rendererView {
            view.translatesAutoresizingMaskIntoConstraints = true
            addSubview(view)
        }
    }

    private func setupCheckVisibilityTimer() {
        guard let checkVisibilityTimeInterval else { return }
        checkVisibilityTimer = Timer.scheduledTimer(withTimeInterval: checkVisibilityTimeInterval, repeats: true) {
            [weak self] timer in
            guard let self else { return }
            self.track?.shouldReceive(self.isVisibleOnScreen)
        }
    }

    private func removeCheckVisibilityTimer() {
        checkVisibilityTimer?.invalidate()
        checkVisibilityTimer = nil
    }

    // this somehow fixes a bug where the view would get layouted but somehow
    // the frame size would be a `0` at the time therefore breaking the video display
    override public func layoutSubviews() {
        super.layoutSubviews()

        if viewSize != frame.size {
            shouldLayout()
        }
    }

    func shouldLayout() {
        setNeedsLayout()

        viewSize = frame.size

        guard let rendererView = rendererView else { return }

        guard let dimensions = track?.dimensions else {
            // hide the view until we receive the video's dimensions
            rendererView.isHidden = true
            return
        }

        if case .fill = layout {
            var size = self.viewSize

            let widthRatio = size.width / CGFloat(dimensions.width)
            let heightRatio = size.height / CGFloat(dimensions.height)

            if heightRatio > widthRatio {
                size.width = size.height / CGFloat(dimensions.height) * CGFloat(dimensions.width)
            } else if widthRatio > heightRatio {
                size.height = size.width / CGFloat(dimensions.width) * CGFloat(dimensions.height)
            }

            // center layout
            rendererView.frame = CGRect(
                x: -((size.width - viewSize.width) / 2),
                y: -((size.height - viewSize.height) / 2),
                width: size.width,
                height: size.height
            )
        } else {
            rendererView.frame = bounds
        }

        rendererView.isHidden = false
    }

    private func update(mirror: Bool) {
        let mirrorTransform = CGAffineTransform(scaleX: -1.0, y: 1.0)

        DispatchQueue.main.async {
            let blurEffect = UIBlurEffect(style: .systemThickMaterial)
            let blurEffectView = UIVisualEffectView(effect: blurEffect)
            blurEffectView.frame = self.bounds
            blurEffectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            blurEffectView.alpha = 0
            self.addSubview(blurEffectView)

            UIView.animate(withDuration: 0.1) {
                blurEffectView.alpha = 1
            }

            DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {

                if mirror {
                    self.transform = mirrorTransform
                } else {
                    self.transform = .identity
                }

            }

            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                UIView.animate(
                    withDuration: 0.1,
                    animations: {
                        blurEffectView.alpha = 0
                    }
                ) { _ in
                    blurEffectView.removeFromSuperview()
                }
            }
        }
    }

    private static func createNativeRendererView() -> RTCMTLVideoView {
        DispatchQueue.fishjam.sync {
            let mtlView = RTCMTLVideoView()
            mtlView.contentMode = .scaleAspectFit
            mtlView.videoContentMode = .scaleAspectFit

            return mtlView
        }
    }

    public func didChange(dimensions: Dimensions) {
        shouldLayout()
        delegate?.didChange(dimensions: dimensions)
    }
}
