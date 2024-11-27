package com.fishjamcloud.test.client

import android.util.Log
import com.fishjamcloud.client.media.LocalAudioTrack
import com.fishjamcloud.client.media.LocalVideoTrack
import com.fishjamcloud.client.models.SimulcastConfig
import com.fishjamcloud.client.models.TrackBandwidthLimit
import com.fishjamcloud.client.models.TrackEncoding
import com.fishjamcloud.client.models.VideoParameters
import com.fishjamcloud.client.utils.addTransceiver
import com.fishjamcloud.client.utils.createOffer
import com.fishjamcloud.client.utils.getEncodings
import com.fishjamcloud.client.utils.setLocalDescription
import com.fishjamcloud.client.webrtc.PeerConnectionFactoryWrapper
import com.fishjamcloud.client.webrtc.PeerConnectionListener
import com.fishjamcloud.client.webrtc.PeerConnectionManager
import fishjam.media_events.server.Server
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.verify
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.junit.Assert
import org.junit.Before
import org.junit.Test
import org.webrtc.MediaConstraints
import org.webrtc.PeerConnection
import org.webrtc.RtpParameters
import org.webrtc.RtpTransceiver
import org.webrtc.SessionDescription
import org.webrtc.VideoTrack

class EndpointConnectionManagerTest {
  private lateinit var manager: PeerConnectionManager
  private lateinit var endpointConnectionMock: PeerConnection

  @Before
  fun createMocks() {
    val endpointConnectionListenerMock = mockk<PeerConnectionListener>(relaxed = true)
    val endpointConnectionFactoryMock = mockk<PeerConnectionFactoryWrapper>(relaxed = true)

    mockkStatic("com.fishjamcloud.client.utils.SuspendableSdpObserverKt")
    mockkStatic("com.fishjamcloud.client.utils.EndpointConnectionUtilsKt")

    mockkStatic(Log::class)
    every { Log.v(any(), any()) } returns 0
    every { Log.d(any(), any()) } returns 0
    every { Log.i(any(), any()) } returns 0
    every { Log.e(any(), any()) } returns 0
    every { Log.println(any(), any(), any()) } returns 0

    endpointConnectionMock = mockk(relaxed = true)

    coEvery {
      endpointConnectionMock.createOffer(any<MediaConstraints>())
    } returns Result.success(SessionDescription(SessionDescription.Type.OFFER, "test_description"))
    coEvery {
      endpointConnectionMock.setLocalDescription(any<SessionDescription>())
    } returns Result.success(Unit)

    every { endpointConnectionFactoryMock.createPeerConnection(any(), any()) } returns endpointConnectionMock

    manager = PeerConnectionManager(endpointConnectionFactoryMock)
    manager.addListener(endpointConnectionListenerMock)
  }

  @OptIn(ExperimentalCoroutinesApi::class)
  @Test
  fun createsOffer() =
    runTest {
      val offer =
        manager.getSdpOffer(
          Server.MediaEvent.OfferData.TrackTypes
            .getDefaultInstance(),
          listOf()
        )

      Assert.assertNotNull(offer)
      Assert.assertEquals("test_description", offer.description)
    }

  @OptIn(ExperimentalCoroutinesApi::class)
  @Test
  fun addsAudioTrack() =
    runTest {
      val audioTrack = LocalAudioTrack(mockk(relaxed = true), "endpoint-id", mockk(relaxed = true), mockk(relaxed = true))
      manager.getSdpOffer(
        Server.MediaEvent.OfferData.TrackTypes
          .getDefaultInstance(),
        listOf(audioTrack)
      )

      verify(exactly = 1) {
        endpointConnectionMock.addTransceiver(
          audioTrack.mediaTrack!!,
          eq(RtpTransceiver.RtpTransceiverDirection.SEND_ONLY),
          match { it.size == 1 },
          withArg {
            Assert.assertEquals("should be just 1 encoding", 1, it.size)
            Assert.assertNull("without rid", it[0].rid)
          }
        )
      }
    }

  @OptIn(ExperimentalCoroutinesApi::class)
  @Test
  fun addsVideoTrack() =
    runTest {
      val mediaTrack: VideoTrack = mockk(relaxed = true)

      every { mediaTrack.kind() } returns "video"

      val videoTrack =
        LocalVideoTrack(
          mediaTrack,
          "endpoint-id",
          mockk(relaxed = true),
          mockk(relaxed = true),
          VideoParameters.presetFHD169
        )
      manager.getSdpOffer(
        Server.MediaEvent.OfferData.TrackTypes
          .getDefaultInstance(),
        listOf(videoTrack)
      )

      verify(exactly = 1) {
        endpointConnectionMock.addTransceiver(
          videoTrack.videoTrack,
          eq(RtpTransceiver.RtpTransceiverDirection.SEND_ONLY),
          match { it.size == 1 },
          withArg {
            Assert.assertEquals("should be just 1 encoding", 1, it.size)
            Assert.assertNull("without rid", it[0].rid)
          }
        )
      }
    }

  @OptIn(ExperimentalCoroutinesApi::class)
  @Test
  fun simulcastConfigIsSet() =
    runTest {
      val videoParameters =
        VideoParameters.presetFHD169.copy(
          simulcastConfig =
            SimulcastConfig(
              true,
              listOf(TrackEncoding.H, TrackEncoding.L)
            )
        )

      val mediaTrack: VideoTrack = mockk(relaxed = true)

      every { mediaTrack.kind() } returns "video"

      val videoTrack =
        LocalVideoTrack(
          mediaTrack,
          "endpoint-id",
          mockk(relaxed = true),
          mockk(relaxed = true),
          videoParameters
        )

      manager.getSdpOffer(
        Server.MediaEvent.OfferData.TrackTypes
          .getDefaultInstance(),
        listOf(videoTrack)
      )

      verify(exactly = 1) {
        endpointConnectionMock.addTransceiver(
          videoTrack.videoTrack,
          eq(RtpTransceiver.RtpTransceiverDirection.SEND_ONLY),
          any(),
          withArg {
            Assert.assertEquals("Should be 3 encodings", 3, it.size)

            Assert.assertEquals("first encoding should have rid=l", "l", it[0].rid)
            Assert.assertTrue("l encoding should be active", it[0].active)
            Assert.assertEquals(
              "l layer should be 4x smaller",
              it[0].scaleResolutionDownBy,
              4.0
            )

            Assert.assertEquals("first encoding should have rid=m", "m", it[1].rid)
            Assert.assertFalse("m encoding should not be active", it[1].active)
            Assert.assertEquals(
              "m layer should be 2x smaller",
              it[1].scaleResolutionDownBy,
              2.0
            )

            Assert.assertEquals("third encoding should have rid=h", "h", it[2].rid)
            Assert.assertTrue("h encoding should be active", it[2].active)
            Assert.assertEquals(
              "h layer should have original size",
              it[2].scaleResolutionDownBy,
              1.0
            )
          }
        )
      }
    }

  @OptIn(ExperimentalCoroutinesApi::class)
  @Test
  fun setTrackBandwidth() =
    runTest {
      val h = RtpParameters.Encoding("h", true, 1.0)
      val m = RtpParameters.Encoding("m", true, 2.0)
      val l = RtpParameters.Encoding("l", true, 4.0)

      every { endpointConnectionMock.senders } returns
        listOf(
          mockk(relaxed = true) {
            every { parameters } returns
              mockk(relaxed = true) {
                every { track()?.id() } returns "dummy_track"
              }
          },
          mockk(relaxed = true) {
            every { parameters } returns
              mockk(relaxed = true) {
                every { track()?.id() } returns "track_id"
                every { getEncodings() } returns
                  listOf(
                    h,
                    m,
                    l
                  )
              }
          }
        )
      manager.getSdpOffer(
        Server.MediaEvent.OfferData.TrackTypes
          .getDefaultInstance(),
        listOf()
      )
      Assert.assertNull("layers have no maxBitrateBps", h.maxBitrateBps)
      manager.setTrackBandwidth("track_id", TrackBandwidthLimit.BandwidthLimit(1000))
      Assert.assertEquals("h layer has correct maxBitrateBps", 780190, h.maxBitrateBps)
      Assert.assertEquals("m layer has correct maxBitrateBps", 195047, m.maxBitrateBps)
      Assert.assertEquals("l layer has correct maxBitrateBps", 48761, l.maxBitrateBps)
    }
}
