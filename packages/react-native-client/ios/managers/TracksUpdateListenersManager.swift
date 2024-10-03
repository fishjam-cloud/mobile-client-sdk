protocol TrackUpdateListener: AnyObject {
    func onTracksUpdate()
}

class TracksUpdateListenersManager {
    private var listeners: [TrackUpdateListener] = []

    func add(_ listener: TrackUpdateListener) {
        listeners.append(listener)
    }

    func remove(_ listener: TrackUpdateListener) {
        listeners.removeAll { $0 === listener }
    }

    func notifyListeners() {
        for listener in listeners {
            listener.onTracksUpdate()
        }
    }
}
