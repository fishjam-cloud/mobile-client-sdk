import android.content.Context
import com.fishjamdev.client.Config
import com.fishjamdev.client.FishjamClient
import com.fishjamdev.client.FishjamClientInternal
import com.fishjamdev.client.FishjamClientListener
import com.fishjamdev.client.media.createAudioDeviceModule
import fishjam.PeerNotifications
import fishjamdev.client.WebsocketMock
import io.mockk.confirmVerified
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.verify
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.webrtc.audio.AudioDeviceModule

class FishjamClientTest {
  private lateinit var websocketMock: WebsocketMock
  private lateinit var fishjamClientListener: FishjamClientListener
  private lateinit var client: FishjamClientInternal

  private val url = "ws://localhost:4000/socket/peer/websocket"
  private val token = "auth"
  private val authRequest =
    PeerNotifications.PeerMessage
      .newBuilder()
      .setAuthRequest(
        PeerNotifications.PeerMessage.AuthRequest
          .newBuilder()
          .setToken(token)
      ).build()

  private val authenticated =
    PeerNotifications.PeerMessage
      .newBuilder()
      .setAuthenticated(PeerNotifications.PeerMessage.Authenticated.newBuilder())
      .build()

  init {
    mockkStatic(::createAudioDeviceModule)
    every { createAudioDeviceModule(any()) } returns mockk<AudioDeviceModule>(relaxed = true)
  }

  @Before
  fun initMocksAndConnect() {
    websocketMock = WebsocketMock()
    fishjamClientListener = mockk(relaxed = true)
    client = FishjamClientInternal(fishjamClientListener, mockk(relaxed = true), mockk(relaxed = true), mockk(relaxed = true))

    client.connect(Config(websocketUrl = url, token = token))
    websocketMock.open()
    verify { fishjamClientListener.onSocketOpen() }
    websocketMock.expect(authRequest)
  }

  @Test
  fun authenticates() {
    websocketMock.sendToClient(authenticated)
    verify { fishjamClientListener.onAuthSuccess() }
  }

  @Test
  fun callsOnSocketError() {
    websocketMock.error()
    verify { fishjamClientListener.onSocketError(any(), any()) }
  }

  @Test
  fun callsOnSocketClosed() {
    websocketMock.close()
    verify { fishjamClientListener.onSocketClose(any(), any()) }
  }

  @After
  fun confirmVerified() {
    confirmVerified(fishjamClientListener)
    websocketMock.confirmVerified()
  }
}
