import ExpoModulesCore
import FishjamCloudClient
import os.log

class VideoPreviewView: VideoRendererView, LocalCameraTrackChangedListener {
    private var localVideoTrack: LocalCameraTrack?

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

            guard
                let localVideoTrack = tracks.first(where: { (key, track) in
                    track is LocalCameraTrack
                })?.value as? LocalCameraTrack, localVideoTrack.id != trackId
            else { return }

            self.localVideoTrack = localVideoTrack
            trackId = localVideoTrack.id
            localVideoTrack.start()
        }
    }

    override func willMove(toSuperview newSuperview: UIView?) {
        if newSuperview == nil {
            RNFishjamClient.localCameraTracksChangedListenersManager.remove(self)
            localVideoTrack?.stop()
        } else {
            RNFishjamClient.localCameraTracksChangedListenersManager.add(self)
            trySetLocalCameraTrack()
        }

        super.willMove(toSuperview: newSuperview)
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
}
