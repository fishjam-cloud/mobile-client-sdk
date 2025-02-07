import Combine
import ExpoModulesCore
import FishjamCloudClient

class VideoRendererView: ExpoView, TrackUpdateListener, VideoViewDelegate {
    enum Event: String {
        case onDimensionsChanged
    }
    
    var videoView: VideoView!
    var cancellableEndpoints: Cancellable?
    
    let onDimensionsChanged = EventDispatcher(Event.onDimensionsChanged.rawValue)

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        videoView = VideoView()
        videoView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        videoView.clipsToBounds = true
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
    
    private func getPeers() -> [[String: Any?]] {
        let endpoints = RNFishjamClient.getLocalAndRemoteEndpoints()
        return endpoints.compactMap { endpoint in
            [
                "id": endpoint.id,
                "isLocal": endpoint.id == RNFishjamClient.fishjamClient!.getLocalEndpoint().id,
                "metadata": endpoint.metadata.toDict(),
                "tracks": endpoint.tracks.values.compactMap { track -> [String: Any?]? in
                    switch track {
                    case let track as RemoteVideoTrack:
                        return [
                            "id": track.id,
                            "type": "Video",
                            "metadata": track.metadata.toDict(),
                            "encoding": track.encoding?.description,
                            "encodingReason": track.encodingReason?.rawValue,
                            "dimensions": track.dimensions.toDict()
                        ]

                    case let track as RemoteAudioTrack:
                        return [
                            "id": track.id,
                            "type": "Audio",
                            "metadata": track.metadata.toDict(),
                            "vadStatus": track.vadStatus == .speech ? "speech" : "silence",
                        ]

                    case let track as LocalCameraTrack:
                        return [
                            "id": track.id,
                            "type": "Video",
                            "metadata": track.metadata.toDict(),
                        ]

                    case let track as LocalBroadcastScreenShareTrack:
                        return [
                            "id": track.id,
                            "type": "Video",
                            "metadata": track.metadata.toDict(),
                        ]

                    case let track as LocalAppScreenShareTrack:
                        return [
                            "id": track.id,
                            "type": "Video",
                            "metadata": track.metadata.toDict(),
                        ]

                    case let track as LocalAudioTrack:
                        return [
                            "id": track.id,
                            "type": "Audio",
                            "metadata": track.metadata.toDict(),
                        ]

                    default:
                        return nil
                    }
                },
            ]
        }
    }
    
    func didChange(dimensions: FishjamCloudClient.Dimensions) {
        guard let dimensions = videoView.track?.dimensions.toDict() else { return }
        onDimensionsChanged(["dimensions" : dimensions])
        //sendEvent(event.event.name, event.data)
        let event = EmitableEvent.peersUpdate(peersData: getPeers())
        appContext?.eventEmitter?.sendEvent(withName: event.event.name, body: event.data)
    }
}
