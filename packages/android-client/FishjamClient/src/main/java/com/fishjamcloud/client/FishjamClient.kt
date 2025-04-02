package com.fishjamcloud.client

import android.content.Context
import android.content.Intent
import com.fishjamcloud.client.media.LocalAudioTrack
import com.fishjamcloud.client.media.LocalScreenShareTrack
import com.fishjamcloud.client.media.LocalVideoTrack
import com.fishjamcloud.client.media.createAudioDeviceModule
import com.fishjamcloud.client.models.CustomSource
import com.fishjamcloud.client.models.EncoderOptions
import com.fishjamcloud.client.models.Metadata
import com.fishjamcloud.client.models.Peer
import com.fishjamcloud.client.models.RTCStats
import com.fishjamcloud.client.models.ReconnectConfig
import com.fishjamcloud.client.models.TrackBandwidthLimit
import com.fishjamcloud.client.models.TrackEncoding
import com.fishjamcloud.client.models.VideoParameters
import com.fishjamcloud.client.ui.VideoTextureViewRenderer
import com.fishjamcloud.client.webrtc.PeerConnectionFactoryWrapper
import com.fishjamcloud.client.webrtc.PeerConnectionManager
import com.fishjamcloud.client.webrtc.RTCEngineCommunication
import org.webrtc.Logging

data class ConnectConfig(
  private val _websocketUrl: String,
  val token: String,
  val peerMetadata: Metadata,
  val reconnectConfig: ReconnectConfig
) {
  val websocketUrl: String
    get() = "$_websocketUrl/socket/peer/websocket"
}

class FishjamClient(
  appContext: Context,
  listener: FishjamClientListener
) {
  private val peerConnectionFactoryWrapper =
    PeerConnectionFactoryWrapper(EncoderOptions(), createAudioDeviceModule(appContext), appContext)
  private val peerConnectionManager = PeerConnectionManager(peerConnectionFactoryWrapper)
  private val rtcEngineCommunication = RTCEngineCommunication()
  private val client = FishjamClientInternal(listener, peerConnectionFactoryWrapper, peerConnectionManager, rtcEngineCommunication)

  /**
   * Connects to the server using the WebSocket connection
   *
   * @param connectConfig - Configuration object for the client
   */
  fun connect(connectConfig: ConnectConfig) {
    client.connect(connectConfig)
  }

  /**
   * Leaves the room. This function should be called when user leaves the room in a clean way e.g. by clicking a
   * dedicated, custom button `disconnect`. As a result there will be generated one more media event that should be sent
   * to the RTC Engine. Thanks to it each other peer will be notified that peer left in {@link MessageEvents.onPeerLeft},
   */
  fun leave(onLeave: (() -> Unit)? = null) {
    client.leave(onLeave)
  }

  /**
   * Creates a video track utilizing device's camera.
   *
   * The client assumes that the user has already granted camera permissions.
   *
   * @param videoParameters a set of target parameters such as camera resolution, frame rate or simulcast configuration
   * @param metadata the metadata that will be sent to the <strong>Membrane RTC Engine</strong> for media negotiation
   * @param captureDeviceName the name of the device to start video capture with, you can get device name by using
   * `LocalVideoTrack.getCaptureDevices` method
   * @return an instance of the video track
   */
  suspend fun createVideoTrack(
    videoParameters: VideoParameters,
    metadata: Metadata,
    captureDeviceName: String? = null
  ): LocalVideoTrack = client.createVideoTrack(videoParameters, metadata, captureDeviceName)

  suspend fun createCustomSource(customSource: CustomSource) = client.createCustomSource(customSource)

  suspend fun removeCustomSource(customSource: CustomSource) = client.removeCustomSource(customSource)

  /**
   * Creates an audio track utilizing device's microphone.
   *
   * The client assumes that the user has already granted microphone recording permissions.
   *
   * @param metadata the metadata that will be sent to the <strong>Membrane RTC Engine</strong> for media negotiation
   * @return an instance of the audio track
   */
  suspend fun createAudioTrack(metadata: Metadata): LocalAudioTrack = client.createAudioTrack(metadata)

  /**
   * Creates a screen track recording the entire device's screen.
   *
   * The method requires a media projection permission to be able to start the recording. The client assumes that the intent is valid.
   *
   * @param mediaProjectionPermission a valid media projection permission intent that can be used to starting a screen capture
   * @param videoParameters a set of target parameters of the screen capture such as resolution, frame rate or simulcast configuration
   * @param metadata the metadata that will be sent to the <strong>Membrane RTC Engine</strong> for media negotiation
   * @param onEnd callback that will be invoked once the screen capture ends
   * @return an instance of the screen share track
   */
  suspend fun createScreenShareTrack(
    mediaProjectionPermission: Intent,
    videoParameters: VideoParameters,
    metadata: Metadata,
    onEnd: (() -> Unit)? = null
  ): LocalScreenShareTrack =
    client.createScreenShareTrack(
      mediaProjectionPermission,
      videoParameters,
      metadata,
      onEnd
    )

  /**
   * Removes an instance of local track from the client.
   *
   * @param trackId an id of a valid local track that has been created using the current client
   * @return a boolean whether the track has been successfully removed or not
   */
  suspend fun removeTrack(trackId: String) = client.removeTrack(trackId)

  /**
   * Sets track encoding that server should send to the client library.
   *
   * The encoding will be sent whenever it is available.
   * If chosen encoding is temporarily unavailable, some other encoding
   * will be sent until chosen encoding becomes active again.
   *
   * @param trackId an id of a remote track
   * @param encoding an encoding to receive
   */
  fun setTargetTrackEncoding(
    trackId: String,
    encoding: TrackEncoding
  ) {
    client.setTargetTrackEncoding(trackId, encoding)
  }

  /**
   * Enables track encoding so that it will be sent to the server.
   *
   * @param trackId an id of a local track
   * @param encoding an encoding that will be enabled
   */
  fun enableTrackEncoding(
    trackId: String,
    encoding: TrackEncoding
  ) {
    client.enableTrackEncoding(trackId, encoding)
  }

  /**
   * Disables track encoding so that it will be no longer sent to the server.
   *
   * @param trackId and id of a local track
   * @param encoding an encoding that will be disabled
   */
  fun disableTrackEncoding(
    trackId: String,
    encoding: TrackEncoding
  ) {
    client.disableTrackEncoding(trackId, encoding)
  }

  /**
   * Updates the metadata for the local peer.
   * @param peerMetadata Data about this peer that other peers will receive upon joining.
   *
   * If the metadata is different from what is already tracked in the room, the optional
   * callback `onPeerUpdated` will be triggered for other peers in the room.
   */
  fun updatePeerMetadata(peerMetadata: Metadata) {
    client.updatePeerMetadata(peerMetadata)
  }

  /**
   * Updates the metadata for a specific track.
   * @param trackId local track id of audio or video track.
   * @param trackMetadata Data about this track that other peers will receive upon joining.
   *
   * If the metadata is different from what is already tracked in the room, the optional
   * callback `onTrackUpdated` will be triggered for other peers in the room.
   */
  fun updateTrackMetadata(
    trackId: String,
    trackMetadata: Metadata
  ) {
    client.updateTrackMetadata(trackId, trackMetadata)
  }

  /**
   * Updates maximum bandwidth for the track identified by trackId.
   * This value directly translates to quality of the stream and, in case of video, to the amount of RTP packets being sent.
   * In case trackId points at the simulcast track bandwidth is split between all of the variant streams proportionally to their resolution.
   * @param trackId track id of a video track
   * @param bandwidthLimit bandwidth in kbps
   */
  fun setTrackBandwidth(
    trackId: String,
    bandwidthLimit: TrackBandwidthLimit.BandwidthLimit
  ) {
    client.setTrackBandwidth(trackId, bandwidthLimit)
  }

  /**
   * Updates maximum bandwidth for the given simulcast encoding of the given track.
   * @param trackId track id of a video track
   * @param encoding rid of the encoding
   * @param bandwidthLimit bandwidth in kbps
   */
  fun setEncodingBandwidth(
    trackId: String,
    encoding: String,
    bandwidthLimit: TrackBandwidthLimit.BandwidthLimit
  ) {
    client.setEncodingBandwidth(trackId, encoding, bandwidthLimit)
  }

  /**
   * Changes severity level of debug logs
   * @param severity enum value representing the logging severity
   */
  fun changeWebRTCLoggingSeverity(severity: Logging.Severity) {
    client.changeWebRTCLoggingSeverity(severity)
  }

  /**
   * Returns current connection stats
   * @return a map containing statistics
   */
  suspend fun getStats(): Map<String, RTCStats> = client.getStats()

  fun getRemotePeers(): List<Peer> = client.getRemotePeers()

  fun getLocalEndpoint(): Peer = client.getLocalEndpoint()

  fun createVideoViewRenderer(): VideoTextureViewRenderer = client.createVideoViewRenderer()
}
