import ExpoModulesCore
import FishjamCloudClient

internal protocol OnLocalCameraTrackChangedListener {
    func onLocalCameraTrackChanged()
}

class VideoPreviewView: ExpoView, OnLocalCameraTrackChangedListener {
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
        DispatchQueue.main.async {
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
            RNFishjamClient.localCameraTrackListeners.removeAll(where: {
                if let view = $0 as? VideoRendererView {
                    return view === self
                }
                return false
            })
            localVideoTrack?.stop()
        } else {
            RNFishjamClient.localCameraTrackListeners.append(self)
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
        if localVideoTrack == nil {
            trySetLocalCameraTrack()
        }
    }
}
