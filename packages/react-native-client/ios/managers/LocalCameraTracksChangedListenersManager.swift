import Foundation

protocol LocalCameraTrackChangedListener: AnyObject {
    func onLocalCameraTrackChanged()
}

class LocalCameraTracksChangedListenersManager {
    private var listeners: [LocalCameraTrackChangedListener] = []

    func add(_ listener: LocalCameraTrackChangedListener) {
        listeners.append(listener)
    }

    func remove(_ listener: LocalCameraTrackChangedListener) {
      listeners.removeAll{ $0 === listener}

    }

    func notifyListeners() {
        for listener in listeners {
            listener.onLocalCameraTrackChanged()
        }
    }
}
