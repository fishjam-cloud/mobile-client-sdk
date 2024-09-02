import Combine
import ExpoModulesCore
import FishjamCloudClient

protocol OnTrackUpdateListener {
    func onTrackUpdate()
}

class VideoRendererView: ExpoView, OnTrackUpdateListener {
    var videoView: VideoView? = nil
    var cancellableEndpoints: Cancellable? = nil

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        RNFishjamClient.onTracksUpdateListeners.append(self)
        videoView = VideoView()
        videoView?.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        videoView?.clipsToBounds = true
        addSubview(videoView!)
        updateVideoTrack()
    }

    deinit {
        RNFishjamClient.onTracksUpdateListeners.removeAll(where: {
            if let view = $0 as? VideoRendererView {
                return view === self
            }
            return false
        })
    }

    func updateVideoTrack() {
        DispatchQueue.main.async {
            for endpoint in RNFishjamClient.getLocalAndRemoteEndpoints() {
                if let track = endpoint.tracks[self.trackId] as? VideoTrack {
                    self.videoView?.track = track
                    return
                }
            }
        }
    }

    func onTrackUpdate() {
        updateVideoTrack()
    }

    var trackId: String = "" {
        didSet {
            updateVideoTrack()
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
}
