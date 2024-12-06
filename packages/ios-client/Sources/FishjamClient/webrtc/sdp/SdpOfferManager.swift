import Foundation
import WebRTC

class SdpOfferManager {
    private let connection: RTCPeerConnection

    init(connection: RTCPeerConnection) {
        self.connection = connection
    }
}
