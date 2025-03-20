struct TrackTypeError: Error, CustomDebugStringConvertible {
    var debugDescription: String {
        return
            "Attempted to add video track to audio-only room. Please refer to the docs at https://docs.fishjam.io/audio-calls"
    }
}
