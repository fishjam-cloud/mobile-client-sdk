import Starscream
import WebRTC

internal protocol FishjamMembraneRTC {
    func disconnect()
    func connect(metadata: Metadata)
    func receiveMediaEvent(mediaEvent: SerializedMediaEvent)
    func onDisconnected()
    func reconnect()
}

extension MembraneRTC: FishjamMembraneRTC {}
