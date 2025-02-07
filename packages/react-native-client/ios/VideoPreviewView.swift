import ExpoModulesCore
import FishjamCloudClient

class VideoPreviewView: ExpoView, LocalCameraTrackChangedListener {
    enum Event: String {
        case onDimensionsChanged
    }
    
    let onDimensionsChanged = EventDispatcher(Event.onDimensionsChanged.rawValue)

    var videoView: VideoView!
    private var localVideoTrack: LocalCameraTrack?

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        videoView = VideoView()
        videoView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        videoView.clipsToBounds = true
    }

    private func trySetLocalCameraTrack() {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            guard let tracks = RNFishjamClient.fishjamClient?.getLocalEndpoint().tracks else {
                os_log(
                    "Error moving VideoPreviewView: %{public}s", log: log, type: .error,
                    String(describing: "No tracks available")
                )
                return
            }

            self.localVideoTrack =
                tracks.first(where: { (key, track) in
                    track is LocalCameraTrack
                })?.value as? LocalCameraTrack
            self.localVideoTrack?.start()
            self.videoView.track = self.localVideoTrack
        }
    }

    override func willMove(toSuperview newSuperview: UIView?) {
        super.willMove(toSuperview: newSuperview)
        if newSuperview == nil {
            videoView.removeFromSuperview()
            RNFishjamClient.localCameraTracksChangedListenersManager.remove(self)
            localVideoTrack?.stop()
        } else {
            addSubview(videoView)
            RNFishjamClient.localCameraTracksChangedListenersManager.add(self)
            trySetLocalCameraTrack()
        }
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        videoView.frame = bounds
    }

    var videoLayout: String = "FILL" {
        didSet {
            switch videoLayout {
            case "FIT":
                videoView.layout = .fit
            case "FILL":
                videoView.layout = .fill
            default:
                videoView.layout = .fill
            }
        }
    }

    var mirrorVideo: Bool = false {
        didSet {
            videoView.mirror = mirrorVideo
        }
    }

    var captureDeviceId: String? = nil {
        didSet {
            guard let captureDeviceId else { return }
            localVideoTrack?.switchCamera(deviceId: captureDeviceId)
        }
    }

    func onLocalCameraTrackChanged() {
        guard localVideoTrack == nil else { return }
        trySetLocalCameraTrack()
    }
    
    func didChange(dimensions: FishjamCloudClient.Dimensions) {
        onDimensionsChanged(["dimensions" : videoView.track?.dimensions.toDict()])
    }
}
