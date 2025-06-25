import Combine
import ExpoModulesCore
import FishjamCloudClient
import WebRTC

class VideoRendererView: ExpoView, TrackUpdateListener, VideoViewDelegate {
    let videoView: VideoView
  
    public private(set) var pipController: PictureInPictureController?

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
                if self.pipController == nil {
                    self.pipController = PictureInPictureController(sourceView: self.videoView)
                    self.pipController?.startAutomatically = true
                }
                self.pipController?.videoTrack = track.videoTrack
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
  
  func setup(pictureInPictureWith controller: PictureInPictureController) {
    self.pipController = controller
    if let track = videoView.track?.videoTrack {
      pipController?.videoTrack = track
    }
  }
  

    func didChange(dimensions newDimensions: FishjamCloudClient.Dimensions) {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }

            let event = EmitableEvent.trackAspectRatioUpdated(
                trackId: trackId,
                aspectRatio: newDimensions.aspectRatio
            )

            RNFishjamClient.sendEvent?(event)
        }
    }
}
