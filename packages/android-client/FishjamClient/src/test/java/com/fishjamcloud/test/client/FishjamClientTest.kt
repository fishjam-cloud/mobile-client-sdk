package com.fishjamcloud.test.client

import com.fishjamcloud.client.Config
import com.fishjamcloud.client.FishjamClientInternal
import com.fishjamcloud.client.FishjamClientListener
import com.fishjamcloud.client.media.createAudioDeviceModule
import fishjam.PeerNotifications
import io.mockk.confirmVerified
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.verify
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import okhttp3.OkHttpClient
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

      client.connect(Config(websocketUrl = url, token = token))
      verify(timeout = 2000) { anyConstructed<OkHttpClient>().newWebSocket(any(), any()) }
      websocketMock.open()
      verify { fishjamClientListener.onSocketOpen() }
      websocketMock.expect(authRequest)
    }
  }

  @Test
  fun authenticates() {
    websocketMock.sendToClient(authenticated)
    verify { fishjamClientListener.onAuthSuccess() }
  }

  @Test
  fun callsOnSocketError() {
    websocketMock.error()
    verify { fishjamClientListener.onSocketError(any()) }
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
