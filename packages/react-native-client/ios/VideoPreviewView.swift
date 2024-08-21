import ExpoModulesCore
import FishjamCloudClient

class VideoPreviewView: ExpoView {
    var videoView: VideoView? = nil
    private var localVideoTrack: LocalVideoTrack? = nil

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        videoView = VideoView()
        videoView?.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        videoView?.clipsToBounds = true
        addSubview(videoView!)
    }

    override func willMove(toWindow newWindow: UIWindow?) {
        if newWindow == nil {
            localVideoTrack?.stop()
        } else {
            guard let tracks = RNFishjamClient.fishjamClient?.getLocalEndpoint().tracks else{
                os_log(
                    "Error moving VideoPreviewView: %{public}s", log: log, type: .error,
                    String(describing: "No tracks available")
                )
                return
            }
            
            localVideoTrack = tracks.first(where: {(key, track) in
                track is LocalVideoTrack
            })?.value as? LocalVideoTrack
            localVideoTrack?.start()
            videoView?.track = localVideoTrack
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
}
