import Foundation
import Mockingbird
import XCTest

@testable import FishjamClient
@testable import Starscream

final class FishjamClientTests: XCTestCase {
    let mockedWebSocket = mock(FishjamWebsocket.self)
    let fishjamClientListener = mock(FishjamClientListener.self)
    let testConfig = ConnectConfig(
        websocketUrl: "ws://test:4000/socket/peer/websocket", token: "testTOKEN", peerMetadata: .init(),
        reconnectConfig: ReconnectConfig())
    var fishjamClient: FishjamClientInternal?
    var webrtc: FishjamMembraneRTC?
    // "Real" websocket class has to be used here since it is needed as a parameter for callbacks.
    // It is safe to use it here because callbacks implemented in the FishjamClientInternal ignore this parameter.

    let socket = WebSocket(request: URLRequest(url: URL(string: "ws://test:4000/socket/peer/websocket")!))

    func getMockWebsocket(url: String) -> FishjamWebsocket {
        return self.mockedWebSocket
    }

    static func generateDataFromMessage(_ message: Fishjam_PeerMessage) -> Data {
        guard let serializedData = try? message.serializedData() else {
            return Data()
        }

        return serializedData
    }

    let authRequest = generateDataFromMessage(
        Fishjam_PeerMessage.with({
            $0.authRequest = Fishjam_PeerMessage.AuthRequest.with({
                $0.token = "testTOKEN"
            })
        }))

    let authResponse = generateDataFromMessage(
        Fishjam_PeerMessage.with({
            $0.authenticated = Fishjam_PeerMessage.Authenticated()
        }))

    let joinEvent = generateDataFromMessage(
        Fishjam_PeerMessage.with({
            $0.mediaEvent = Fishjam_PeerMessage.MediaEvent.with({
                $0.data = "join"
            })
        })
    )

    let sdpOfferEvent = generateDataFromMessage(
        Fishjam_PeerMessage.with({
            $0.mediaEvent = Fishjam_PeerMessage.MediaEvent.with({
                $0.data = "sdpOffer"
            })
        })
    )

    override func setUp() {
        let webrtc = mock(FishjamMembraneRTC.self)
        let fishjamClient = FishjamClientInternal(
            listener: self.fishjamClientListener, websocketFactory: getMockWebsocket)
        fishjamClient.webrtcClient = webrtc
        self.fishjamClient = fishjamClient
        self.webrtc = webrtc
        givenSwift(self.mockedWebSocket.connect()).will {
            self.fishjamClient?.websocketDidConnect()
        }
    }

    func connect() {
        fishjamClient?.connect(config: self.testConfig)
        verifyClientSent(authRequest)
        sendToClient(authResponse)
    }

    func sendToClient(_ data: Data) {
        self.fishjamClient?.websocketDidReceiveData(data: data)
    }

    func verifyClientSent(_ data: Data) {
        verify(self.mockedWebSocket.write(data: data)).wasCalled()
    }

    func testCleansUp() throws {
        connect()
        fishjamClient?.cleanUp()
        verify(self.mockedWebSocket.disconnect()).wasCalled()
        verify(self.fishjamClientListener.onDisconnected()).wasCalled()
        verify(self.webrtc?.disconnect()).wasCalled()
    }

    func testReceivesMediaEvents() throws {
        connect()
        sendToClient(sdpOfferEvent)
        verify(self.webrtc?.receiveMediaEvent(mediaEvent: "sdpOffer")).wasCalled()
    }

    func testSendsMediaEvents() throws {
        connect()
        fishjamClient?.onSendMediaEvent(event: "join")
        verifyClientSent(joinEvent)
    }
}
