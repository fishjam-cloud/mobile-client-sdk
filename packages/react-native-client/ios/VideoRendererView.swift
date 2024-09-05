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
    }

    deinit {
        RNFishjamClient.onTracksUpdateListeners.removeAll(where: {
            if let view = $0 as? VideoRendererView {
                return view === self
            }
            return false
        })
    }

    override func willMove(toSuperview newSuperview: UIView?) {
        super.willMove(toSuperview: newSuperview)

        if newSuperview != nil {
            updateVideoTrack()
        }
    }

    func updateVideoTrack() {
        DispatchQueue.main.async {
            if self.superview != nil {
                for endpoint in RNFishjamClient.getLocalAndRemoteEndpoints() {
                    if let track = endpoint.tracks[self.trackId] as? VideoTrack {
                        if let track = track as? LocalVideoTrack {
                            self.mirrorVideo = track.isFrontCamera
                        }
                        self.videoView?.track = track
                        return
                    }
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
