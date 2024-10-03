import ExpoModulesCore
import FishjamCloudClient

class VideoPreviewView: ExpoView, LocalCameraTrackChangedListener {
    var videoView: VideoView? = nil
    private var localVideoTrack: LocalVideoTrack? = nil

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        videoView = VideoView()
        videoView?.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        videoView?.clipsToBounds = true
        addSubview(videoView!)
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
                    track is LocalVideoTrack
                })?.value as? LocalVideoTrack
            self.localVideoTrack?.start()
            self.videoView?.track = self.localVideoTrack
        }
    }

    override func willMove(toSuperview newSuperview: UIView?) {
        super.willMove(toSuperview: newSuperview)
        if newSuperview == nil {
            RNFishjamClient.localCameraTracksChangedListenersManager.remove(self)
            localVideoTrack?.stop()
        } else {
            RNFishjamClient.localCameraTracksChangedListenersManager.add(self)
            trySetLocalCameraTrack()
        }
    }

    var videoLayout: String = "FILL" {
        didSet {
            switch videoLayout {
            case "FIT":
                self.videoView?.layout = .fit
            case "FILL":
                self.videoView?.layout = .fill
            default:
                self.videoView?.layout = .fill
            }
        }
    }

    var mirrorVideo: Bool = false {
        didSet {
            self.videoView?.mirror = mirrorVideo
        }
    }

    var captureDeviceId: String? = nil {
        didSet {
            if let captureDeviceId = captureDeviceId {
                localVideoTrack?.switchCamera(deviceId: captureDeviceId)
            }
        }
    }

    func onLocalCameraTrackChanged() {
        guard localVideoTrack == nil else { return }
        trySetLocalCameraTrack()
    }
}
