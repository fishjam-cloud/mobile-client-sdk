import Combine
import ExpoModulesCore
import FishjamCloudClient

class VideoRendererView: ExpoView, TrackUpdateListener, VideoViewDelegate {
    let videoView: VideoView
        
    required init(appContext: AppContext? = nil) {
        videoView = VideoView()
        videoView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        videoView.clipsToBounds = true
        
        super.init(appContext: appContext)
        
        videoView.delegate = self
    }

    override func willMove(toSuperview newSuperview: UIView?) {
        super.willMove(toSuperview: newSuperview)

        if newSuperview == nil {
            videoView.removeFromSuperview()
            RNFishjamClient.tracksUpdateListenersManager.remove(self)
        } else {
            addSubview(videoView)
            RNFishjamClient.tracksUpdateListenersManager.add(self)
            updateVideoTrack()
        }
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        videoView.frame = bounds
    }

    func updateVideoTrack() {
        DispatchQueue.main.async { [weak self] in
            guard let self, self.superview != nil else { return }
            for endpoint in RNFishjamClient.getLocalAndRemoteEndpoints() {
                guard let track = endpoint.tracks[self.trackId] as? VideoTrack else { continue }
                if let track = track as? LocalCameraTrack {
                    self.mirrorVideo = track.isFrontCamera
                }
                self.videoView.track = track
                return
            }
        }
    }

    func onTracksUpdate() {
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

    var checkVisibilityTimeInterval: TimeInterval? {
        didSet {
            videoView.checkVisibilityTimeInterval = checkVisibilityTimeInterval
        }
    }
    
    func didChange(dimensions newDimensions: FishjamCloudClient.Dimensions) {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            
            let event = EmitableEvent.trackAspectRatioUpdated(
                trackId: trackId,
                aspectRatio: AspectRatio(dimensions: newDimensions)
            )
            
            self.appContext?.eventEmitter?.sendEvent(
                withName: event.event.name,
                body: event.data
            )
        }
    }
}
