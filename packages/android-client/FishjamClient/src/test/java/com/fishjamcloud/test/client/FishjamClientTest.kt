package com.fishjamcloud.test.client

import com.fishjamcloud.client.FishjamClientInternal
import com.fishjamcloud.client.FishjamClientListener
import com.fishjamcloud.client.media.createAudioDeviceModule
import fishjam.PeerNotifications
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkStatic
import org.webrtc.audio.AudioDeviceModule

class FishjamClientTest {
  private lateinit var websocketMock: WebsocketMock
  private lateinit var fishjamClientListener: FishjamClientListener
  private lateinit var client: FishjamClientInternal

  private val url = "ws://localhost:4000"
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

  /*

  TODO: those tests are flaky on CI and don't really test much, maybe we'll improve them in the future

  @OptIn(ExperimentalCoroutinesApi::class)
  @Before
  fun initMocksAndConnect() {
    runTest {
      websocketMock = WebsocketMock()
      fishjamClientListener = mockk(relaxed = true)
      client =
        FishjamClientInternal(
          fishjamClientListener,
          mockk(relaxed = true),
          mockk(relaxed = true),
          mockk(relaxed = true)
        )

      client.connect(
        ConnectConfig(websocketUrl = url, token = token, peerMetadata = emptyMap(), reconnectConfig = ReconnectConfig(maxAttempts = 0))
      )
      coVerify(timeout = 2000) { anyConstructed<OkHttpClient>().newWebSocket(any(), any()) }
      websocketMock.open()
      websocketMock.expect(authRequest)
    }
  }

  @Test
  fun callsOnSocketError() {
    websocketMock.error()
    verify { fishjamClientListener.onSocketError(any()) }
    verify { fishjamClientListener.onReconnectionRetriesLimitReached() }
    websocketMock.expectClosed()
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
   */
}
