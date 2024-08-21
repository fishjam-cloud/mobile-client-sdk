import Combine
import ExpoModulesCore
import FishjamCloudClient

class VideoRendererView: ExpoView {
    var videoView: VideoView? = nil
    var cancellableEndpoints: Cancellable? = nil

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        videoView = VideoView()
        videoView?.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        videoView?.clipsToBounds = true
        addSubview(videoView!)
        cancellableEndpoints = MembraneRoom.sharedInstance.$endpoints
            .sink { [weak self] _ in
                self?.updateVideoTrack()
            }
    }

    func updateVideoTrack() {
        DispatchQueue.main.async {
            endpointLoop: for endpoint in RNFishjamClient.getLocalAndRemoteEndpoints(){
                for (id, track) in endpoint.tracks {
                    if let videoTrack = track as? VideoTrack, self.trackId == id {
                        self.videoView?.track = videoTrack
                        break endpointLoop
                    }
                }
            }
        }
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
