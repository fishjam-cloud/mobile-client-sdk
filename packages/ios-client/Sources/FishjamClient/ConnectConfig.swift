
import Foundation

public struct ConnectConfig {
    var websocketUrl: String
    var token: String
    var peerMetadata: Metadata
    var reconnectConfig: ReconnectConfig

    public init(websocketUrl: String, token: String, peerMetadata: Metadata, reconnectConfig: ReconnectConfig) {
        self.websocketUrl = websocketUrl + "/socket/peer/websocket"
        self.token = token
        self.peerMetadata = peerMetadata
        self.reconnectConfig = reconnectConfig
    }
}
