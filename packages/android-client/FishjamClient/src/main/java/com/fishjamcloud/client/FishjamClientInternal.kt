package com.fishjamcloud.client

import android.content.Intent
import com.fishjamcloud.client.media.LocalAudioTrack
import com.fishjamcloud.client.media.LocalScreenShareTrack
import com.fishjamcloud.client.media.LocalTrack
import com.fishjamcloud.client.media.LocalVideoTrack
import com.fishjamcloud.client.media.RemoteAudioTrack
import com.fishjamcloud.client.media.RemoteVideoTrack
import com.fishjamcloud.client.media.Track
import com.fishjamcloud.client.models.AuthError
import com.fishjamcloud.client.models.CustomSource
import com.fishjamcloud.client.models.CustomSourceManager
import com.fishjamcloud.client.models.EncodingReason
import com.fishjamcloud.client.models.Endpoint
import com.fishjamcloud.client.models.Metadata
import com.fishjamcloud.client.models.Peer
import com.fishjamcloud.client.models.RTCStats
import com.fishjamcloud.client.models.RoomState
import com.fishjamcloud.client.models.SimulcastConfig
import com.fishjamcloud.client.models.TrackBandwidthLimit
import com.fishjamcloud.client.models.TrackEncoding
import com.fishjamcloud.client.models.VideoParameters
import com.fishjamcloud.client.ui.VideoSurfaceViewRenderer
import com.fishjamcloud.client.utils.ClosableCoroutineScope
import com.fishjamcloud.client.utils.TimberDebugTree
import com.fishjamcloud.client.utils.serializeToMap
import com.fishjamcloud.client.webrtc.PeerConnectionFactoryWrapper
import com.fishjamcloud.client.webrtc.PeerConnectionListener
import com.fishjamcloud.client.webrtc.PeerConnectionManager
import com.fishjamcloud.client.webrtc.RTCEngineCommunication
import com.fishjamcloud.client.webrtc.RTCEngineListener
import com.fishjamcloud.client.webrtc.helpers.TrackBitratesMapper
import fishjam.PeerNotifications
import fishjam.PeerNotifications.PeerMessage
import fishjam.media_events.server.Server
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import okio.ByteString
import okio.ByteString.Companion.toByteString
import org.webrtc.AudioTrack
import org.webrtc.IceCandidate
import org.webrtc.Logging
import org.webrtc.MediaStreamTrack
import org.webrtc.VideoTrack
import timber.log.Timber

internal class FishjamClientInternal(
  private val listener: FishjamClientListener,
  private val peerConnectionFactoryWrapper: PeerConnectionFactoryWrapper,
  private val peerConnectionManager: PeerConnectionManager,
  private val rtcEngineCommunication: RTCEngineCommunication
) : RTCEngineListener,
  PeerConnectionListener {
  private val commandsQueue: CommandsQueue = CommandsQueue()
  private var webSocket: WebSocket? = null

  private var localEndpoint: Endpoint = Endpoint(id = "")
  private var prevTracks = mutableListOf<Track>()
  private var remoteEndpoints: MutableMap<String, Endpoint> = mutableMapOf()

  private var roomState = RoomState()

  private val coroutineScope: CoroutineScope =
    ClosableCoroutineScope(SupervisorJob() + Dispatchers.Default)
  private var connectConfig: ConnectConfig? = null

  private lateinit var reconnectionManager: ReconnectionManager

  private val customSourceManager = CustomSourceManager()

  init {
    if (BuildConfig.DEBUG) {
      Timber.plant(TimberDebugTree())
    }
  }

  private fun getTrack(trackId: String): Track? =
    localEndpoint.tracks[trackId]
      ?: remoteEndpoints.values.find { endpoint -> endpoint.tracks[trackId] != null }?.tracks?.get(
        trackId
      )

  private fun getTrackWithRtcEngineId(trackId: String): Track? =
    localEndpoint.tracks.values.firstOrNull { track -> track.webrtcId() == trackId }
      ?: remoteEndpoints.values
        .firstOrNull { endpoint ->
          endpoint.tracks.values.firstOrNull { track -> track.getRTCEngineId() == trackId } !=
            null
        }?.tracks
        ?.values
        ?.firstOrNull { track -> track.getRTCEngineId() == trackId }

  fun connect(connectConfig: ConnectConfig) {
    this.connectConfig = connectConfig
    this.reconnectionManager =
      ReconnectionManager(connectConfig.reconnectConfig) {
        reconnect(connectConfig)
      }
    peerConnectionManager.addListener(this)
    rtcEngineCommunication.addListener(this)
    reconnectionManager.addListener(listener)
    setupWebSocket(connectConfig)
  }

  private fun reconnect(connectConfig: ConnectConfig) {
    recreateTracks()
    setupWebSocket(connectConfig)
  }

  private fun setupWebSocket(connectConfig: ConnectConfig) {
    val websocketListener =
      object : WebSocketListener() {
        override fun onClosed(
          webSocket: WebSocket,
          code: Int,
          reason: String
        ) {
          listener.onSocketClose(code, reason)
          commandsQueue.onDisconnected()
        }

        override fun onClosing(
          webSocket: WebSocket,
          code: Int,
          reason: String
        ) {
          if (AuthError.isAuthError(reason)) {
            listener.onAuthError(AuthError.fromString(reason))
          } else {
            webSocket.close(code, reason)
          }
        }

        override fun onMessage(
          webSocket: WebSocket,
          bytes: ByteString
        ) {
          try {
            val peerMessage = PeerNotifications.PeerMessage.parseFrom(bytes.toByteArray())
            if (peerMessage.hasAuthenticated()) {
              roomState.isAuthenticated = true
              roomState.type = peerMessage.authenticated.roomType
              commandsQueue.finishCommand()
              join()
            } else if (peerMessage.hasServerMediaEvent()) {
              receiveEvent(peerMessage.serverMediaEvent)
            } else {
              Timber.w("Received unexpected websocket message: $peerMessage")
            }
          } catch (e: Exception) {
            Timber.e("Received invalid websocket message", e)
          }
        }

        override fun onOpen(
          webSocket: WebSocket,
          response: Response
        ) {
          val authRequest =
            PeerNotifications.PeerMessage
              .newBuilder()
              .setAuthRequest(
                PeerNotifications.PeerMessage.AuthRequest
                  .newBuilder()
                  .setToken(connectConfig.token)
                  .setSdkVersion("mobile-${BuildConfig.PACKAGE_VERSION}")
              ).build()
          sendEvent(authRequest)
        }

        override fun onFailure(
          webSocket: WebSocket,
          t: Throwable,
          response: Response?
        ) {
          listener.onSocketError(t)
          commandsQueue.onDisconnected()
          coroutineScope.launch {
            prepareToReconnect()
            reconnectionManager.onDisconnected()
          }
        }
      }

    coroutineScope.launch {
      commandsQueue.addCommand(
        Command(CommandName.CONNECT, ClientState.CONNECTED) {
          val request = Request.Builder().url(connectConfig.websocketUrl).build()
          val webSocket =
            OkHttpClient().newWebSocket(
              request,
              websocketListener
            )

          this@FishjamClientInternal.webSocket = webSocket
        }
      )
    }
  }

  private suspend fun prepareToReconnect() {
    peerConnectionManager.close()
    webSocket?.close(1000, null)
    webSocket = null
    remoteEndpoints = mutableMapOf()
    prevTracks = localEndpoint.tracks.values.toMutableList()
    localEndpoint = Endpoint(id = "")
  }

  private fun join() {
    coroutineScope.launch {
      commandsQueue.addCommand(
        Command(CommandName.JOIN, ClientState.JOINED) {
          rtcEngineCommunication.connect(connectConfig?.peerMetadata ?: emptyMap())
        }
      )
    }
  }

  override fun onConnected(
    endpointID: String,
    endpoints: Map<String, Server.MediaEvent.Endpoint>,
    iceServers: List<Server.MediaEvent.IceServer>
  ) {
    if (roomState.type == PeerNotifications.PeerMessage.RoomType.ROOM_TYPE_AUDIO_ONLY && localEndpoint.hasVideoTracks()) {
      Timber.e("Error while joining room. Room state is audio only but local track is video.")
      listener.onJoinError(mapOf("reason" to "audio_only_room_with_video_track"))
      return
    }

    localEndpoint = localEndpoint.copy(id = endpointID)
    peerConnectionManager.setupIceServers(iceServers)

    endpoints.forEach {
      val (endpointId, endpointData) = it
      if (endpointId == endpointID) {
        this.localEndpoint =
          this.localEndpoint.copy(metadata = endpointData.metadataJson.serializeToMap())
      } else {
        var endpoint = Endpoint(endpointId, endpointData.metadataJson.serializeToMap())

        for ((trackId, trackData) in endpointData.trackIdToTrackMap) {
          val track =
            Track(
              mediaTrack = null,
              sendEncodings = emptyList(),
              endpointId = endpointId,
              rtcEngineId = trackId,
              metadata = trackData.metadataJson.serializeToMap()
            )
          endpoint = endpoint.addOrReplaceTrack(track)
          this.listener.onTrackAdded(track)
        }
        this.remoteEndpoints[endpointId] = endpoint
      }
    }
    listener.onJoined(endpointID, remoteEndpoints)
    commandsQueue.finishCommand()
    reconnectionManager.onReconnected()

    if (localEndpoint.tracks.isEmpty()) {
      return
    }

    coroutineScope.launch {
      commandsQueue.addCommand(
        Command(CommandName.ADD_TRACK) {
          coroutineScope.launch {
            if (commandsQueue.clientState == ClientState.CONNECTED || commandsQueue.clientState == ClientState.JOINED) {
              rtcEngineCommunication.renegotiateTracks()
            } else {
              commandsQueue.finishCommand(CommandName.ADD_TRACK)
            }
          }
        }
      )
    }
  }

  fun leave(onLeave: (() -> Unit)? = null) {
    coroutineScope.launch {
      rtcEngineCommunication.disconnect()
      localEndpoint.tracks.values.forEach { (it as? LocalTrack)?.stop() }
      peerConnectionManager.close()
      localEndpoint = Endpoint(id = "")
      remoteEndpoints = mutableMapOf()
      peerConnectionManager.removeListener(this@FishjamClientInternal)
      rtcEngineCommunication.removeListener(this@FishjamClientInternal)
      webSocket?.close(1000, null)
      webSocket = null
      roomState = RoomState()
      commandsQueue.clear()
      onLeave?.invoke()
    }
  }

  suspend fun createCustomSource(customSource: CustomSource) {
    val videoSource = peerConnectionFactoryWrapper.createVideoSource(customSource.isScreenShare)
    val webrtcVideoTrack = peerConnectionFactoryWrapper.createVideoTrack(videoSource)

    val videoTrack =
      com.fishjamcloud.client.media
        .VideoTrack(webrtcVideoTrack, localEndpoint.id, null, customSource.metadata)

    commandsQueue
      .addCommand(
        Command(CommandName.ADD_TRACK) {
          localEndpoint = localEndpoint.addOrReplaceTrack(videoTrack)

          coroutineScope.launch {
            addTrack(videoTrack)
            if (commandsQueue.clientState == ClientState.CONNECTED || commandsQueue.clientState == ClientState.JOINED) {
              rtcEngineCommunication.renegotiateTracks()
            } else {
              commandsQueue.finishCommand(CommandName.ADD_TRACK)
            }
          }
        }
      )

    customSourceManager.add(customSource, videoTrack.id(), videoSource)

    listener.onTrackAdded(videoTrack)
  }

  suspend fun removeCustomSource(customSource: CustomSource) {
    val trackId = customSourceManager.remove(customSource)
    if (trackId != null) {
      removeTrack(trackId)
    }
  }

  suspend fun createVideoTrack(
    videoParameters: VideoParameters,
    metadata: Metadata,
    captureDeviceName: String? = null
  ): LocalVideoTrack {
    val videoSource = peerConnectionFactoryWrapper.createVideoSource(isScreencast = false)
    val webrtcVideoTrack = peerConnectionFactoryWrapper.createVideoTrack(videoSource)
    val videoCapturer =
      peerConnectionFactoryWrapper.createVideoCapturer(
        videoSource,
        videoParameters,
        captureDeviceName
      )

    val videoTrack =
      LocalVideoTrack(webrtcVideoTrack, localEndpoint.id, metadata, videoCapturer, videoParameters)

    videoTrack.start()

    commandsQueue
      .addCommand(
        Command(CommandName.ADD_TRACK) {
          localEndpoint = localEndpoint.addOrReplaceTrack(videoTrack)

          coroutineScope.launch {
            addTrack(videoTrack)
            if (commandsQueue.clientState == ClientState.CONNECTED || commandsQueue.clientState == ClientState.JOINED) {
              rtcEngineCommunication.renegotiateTracks()
            } else {
              commandsQueue.finishCommand(CommandName.ADD_TRACK)
            }
          }
        }
      )

    return videoTrack
  }

  override fun onSdpAnswer(
    sdp: String,
    midToTrackId: Map<String, String>
  ) {
    coroutineScope.launch {
      peerConnectionManager.onSdpAnswer(sdp, midToTrackId)

      // temporary workaround, the backend doesn't add ~ in sdp answer
      localEndpoint.tracks.values.forEach { localTrack ->
        localTrack.mediaTrack?.id()?.let { localTrack.setRTCEngineId(it) }
        if (localTrack.mediaTrack?.kind() != "video") return@forEach
        var config: SimulcastConfig? = null
        if (localTrack is LocalVideoTrack) {
          config = localTrack.videoParameters.simulcastConfig
        } else if (localTrack is LocalScreenShareTrack) {
          config = localTrack.videoParameters.simulcastConfig
        }
        listOf(TrackEncoding.L, TrackEncoding.M, TrackEncoding.H).forEach {
          if (config?.activeEncodings?.contains(it) == false) {
            peerConnectionManager.setTrackEncoding(localTrack.webrtcId(), it, false)
          }
        }
      }

      if (sdp.contains("a=inactive")) {
        listener.onIncompatibleTracksDetected()
      }

      commandsQueue.finishCommand(listOf(CommandName.ADD_TRACK, CommandName.REMOVE_TRACK))
    }
  }

  suspend fun createAudioTrack(metadata: Metadata): LocalAudioTrack {
    val audioSource = peerConnectionFactoryWrapper.createAudioSource()
    val webrtcAudioTrack = peerConnectionFactoryWrapper.createAudioTrack(audioSource)
    val audioTrack = LocalAudioTrack(webrtcAudioTrack, localEndpoint.id, metadata, audioSource)
    audioTrack.start()

    commandsQueue
      .addCommand(
        Command(CommandName.ADD_TRACK) {
          localEndpoint = localEndpoint.addOrReplaceTrack(audioTrack)

          coroutineScope.launch {
            addTrack(audioTrack)
            if (commandsQueue.clientState == ClientState.CONNECTED || commandsQueue.clientState == ClientState.JOINED) {
              rtcEngineCommunication.renegotiateTracks()
            } else {
              commandsQueue.finishCommand(CommandName.ADD_TRACK)
            }
          }
        }
      )

    return audioTrack
  }

  suspend fun createScreenShareTrack(
    mediaProjectionPermission: Intent,
    videoParameters: VideoParameters,
    metadata: Metadata,
    onEnd: (() -> Unit)? = null
  ): LocalScreenShareTrack {
    val videoSource = peerConnectionFactoryWrapper.createVideoSource(isScreencast = true)
    val webrtcTrack = peerConnectionFactoryWrapper.createVideoTrack(videoSource)
    val callback = LocalScreenShareTrack.ProjectionCallback()
    val capturer =
      peerConnectionFactoryWrapper.createScreenCapturer(
        videoSource,
        callback,
        mediaProjectionPermission
      )
    val screenShareTrack =
      LocalScreenShareTrack(
        webrtcTrack,
        localEndpoint.id,
        metadata,
        capturer,
        videoParameters,
        videoSource
      )
    screenShareTrack.start()
    callback.addCallback {
      if (onEnd != null) {
        onEnd()
      }
    }

    commandsQueue
      .addCommand(
        Command(CommandName.ADD_TRACK) {
          localEndpoint = localEndpoint.addOrReplaceTrack(screenShareTrack)

          coroutineScope.launch {
            addTrack(screenShareTrack)
            rtcEngineCommunication.renegotiateTracks()
          }
        }
      )

    return screenShareTrack
  }

  suspend fun removeTrack(trackId: String) {
    commandsQueue
      .addCommand(
        Command(CommandName.REMOVE_TRACK) {
          val track: Track =
            getTrack(trackId) ?: run {
              Timber.e("removeTrack: Can't find track to remove")
              return@Command
            }

          localEndpoint = localEndpoint.removeTrack(trackId)
          (track as LocalTrack).stop()

          coroutineScope.launch {
            peerConnectionManager.removeTrack(track.webrtcId())
            rtcEngineCommunication.renegotiateTracks()
          }
        }
      )
  }

  fun setTargetTrackEncoding(
    trackId: String,
    encoding: TrackEncoding
  ) {
    coroutineScope.launch {
      val rtcEngineTrackId =
        getTrack(trackId)?.getRTCEngineId() ?: run {
          Timber.e("setTargetTrackEncoding: invalid track id")
          return@launch
        }
      rtcEngineCommunication.setTargetTrackEncoding(rtcEngineTrackId, encoding)
    }
  }

  fun enableTrackEncoding(
    trackId: String,
    encoding: TrackEncoding
  ) {
    coroutineScope.launch {
      val webrtcId =
        getTrack(trackId)?.webrtcId() ?: run {
          Timber.e("enableTrackEncoding: invalid track id")
          return@launch
        }
      peerConnectionManager.setTrackEncoding(webrtcId, encoding, true)
    }
  }

  fun disableTrackEncoding(
    trackId: String,
    encoding: TrackEncoding
  ) {
    coroutineScope.launch {
      val webrtcId =
        getTrack(trackId)?.webrtcId() ?: run {
          Timber.e("enableTrackEncoding: invalid track id")
          return@launch
        }
      peerConnectionManager.setTrackEncoding(webrtcId, encoding, false)
    }
  }

  fun updatePeerMetadata(peerMetadata: Metadata) {
    coroutineScope.launch {
      rtcEngineCommunication.updatePeerMetadata(peerMetadata)
    }
  }

  fun updateTrackMetadata(
    trackId: String,
    trackMetadata: Metadata
  ) {
    val track =
      getTrack(trackId) ?: run {
        Timber.e("updateTrackMetadata: invalid track id")
        return
      }
    track.metadata = trackMetadata
    localEndpoint = localEndpoint.addOrReplaceTrack(track)
    coroutineScope.launch {
      val rtcEngineTrackId = track.getRTCEngineId()
      if (rtcEngineTrackId != null) {
        rtcEngineCommunication.updateTrackMetadata(rtcEngineTrackId, trackMetadata)
      }
    }
  }

  fun setTrackBandwidth(
    trackId: String,
    bandwidthLimit: TrackBandwidthLimit.BandwidthLimit
  ) {
    coroutineScope.launch {
      val webrtcId =
        getTrack(trackId)?.webrtcId() ?: run {
          Timber.e("setTrackBandwidth: invalid track id")
          return@launch
        }
      peerConnectionManager.setTrackBandwidth(webrtcId, bandwidthLimit)
    }
  }

  fun setEncodingBandwidth(
    trackId: String,
    encoding: String,
    bandwidthLimit: TrackBandwidthLimit.BandwidthLimit
  ) {
    coroutineScope.launch {
      val webrtcId =
        getTrack(trackId)?.webrtcId() ?: run {
          Timber.e("setEncodingBandwidth: invalid track id")
          return@launch
        }
      peerConnectionManager.setEncodingBandwidth(webrtcId, encoding, bandwidthLimit)
    }
  }

  fun changeWebRTCLoggingSeverity(severity: Logging.Severity) {
    Logging.enableLogToDebugOutput(severity)
  }

  suspend fun getStats(): Map<String, RTCStats> = peerConnectionManager.getStats()

  fun getRemotePeers(): List<Peer> = remoteEndpoints.values.toList()

  fun getLocalEndpoint(): Endpoint = localEndpoint

  fun createVideoViewRenderer(): VideoSurfaceViewRenderer = peerConnectionFactoryWrapper.createVideoViewRenderer()

  private fun sendEvent(peerMessage: PeerNotifications.PeerMessage) {
    webSocket?.send(peerMessage.toByteArray().toByteString())
  }

  private fun receiveEvent(event: Server.MediaEvent) {
    rtcEngineCommunication.onEvent(event)
  }

  override fun onSendMediaEvent(event: fishjam.media_events.peer.Peer.MediaEvent) {
    if (!roomState.isAuthenticated) {
      Timber.e("Tried to send media event: $event before authentication")
      return
    }

    val mediaEvent =
      PeerNotifications.PeerMessage
        .newBuilder()
        .setPeerMediaEvent(event)
        .build()
    sendEvent(mediaEvent)
  }

  override fun onEndpointAdded(
    endpointId: String,
    metadata: Metadata?
  ) {
    if (endpointId == this.localEndpoint.id) {
      return
    }

    val endpoint = Endpoint(endpointId, metadata)

    remoteEndpoints[endpoint.id] = endpoint

    listener.onPeerJoined(endpoint)
  }

  override fun onEndpointRemoved(endpointId: String) {
    if (endpointId == localEndpoint.id) {
      listener.onDisconnected()
      return
    }
    val endpoint =
      remoteEndpoints.remove(endpointId) ?: run {
        Timber.e("Failed to process EndpointLeft event: Endpoint not found: $endpointId")
        return
      }

    endpoint.tracks.forEach { (_, track) ->
      listener.onTrackRemoved(track)
    }

    listener.onPeerLeft(endpoint)
  }

  override fun onEndpointUpdated(
    endpointId: String,
    endpointMetadata: Metadata?
  ) {
    if (endpointId == this.localEndpoint.id) {
      localEndpoint = this.localEndpoint.copy(metadata = endpointMetadata)
      listener.onPeerUpdated(localEndpoint)
      return
    }

    val endpoint =
      remoteEndpoints.remove(endpointId) ?: run {
        Timber.e("Failed to process EndpointUpdated event: Endpoint not found: $endpointId")
        return
      }

    remoteEndpoints[endpoint.id] = endpoint.copy(metadata = endpointMetadata)
  }

  private fun recreateTracks() {
    prevTracks.forEach { track ->
      when (track) {
        is LocalVideoTrack -> {
          val webrtcVideoTrack =
            peerConnectionFactoryWrapper.createVideoTrack(track.videoSource)
          val videoTrack = LocalVideoTrack(webrtcVideoTrack, track)
          localEndpoint = localEndpoint.addOrReplaceTrack(videoTrack)
        }

        is LocalAudioTrack -> {
          val webrtcAudioTrack = peerConnectionFactoryWrapper.createAudioTrack(track.audioSource)
          val audioTrack = LocalAudioTrack(webrtcAudioTrack, track)
          localEndpoint = localEndpoint.addOrReplaceTrack(audioTrack)
        }

        is LocalScreenShareTrack -> {
          val webrtcTrack = peerConnectionFactoryWrapper.createVideoTrack(track.videoSource)
          val screenShareTrack = LocalScreenShareTrack(webrtcTrack, track)
          localEndpoint = localEndpoint.addOrReplaceTrack(screenShareTrack)
        }
      }
    }
    prevTracks = mutableListOf()
  }

  private suspend fun addTrack(track: Track) {
    if (roomState.type == PeerMessage.RoomType.ROOM_TYPE_AUDIO_ONLY && track is com.fishjamcloud.client.media.VideoTrack) {
      Timber.e("Cannot add track to an audio_only room.")
      listener.onJoinError(mapOf("reason" to "audio_only_room_with_video_track"))
      return
    }
    peerConnectionManager.addTrack(track)
  }

  override fun onOfferData(tracksTypes: Server.MediaEvent.OfferData.TrackTypes) {
    coroutineScope.launch {
      try {
        val offer =
          peerConnectionManager.getSdpOffer(
            tracksTypes,
            localEndpoint.tracks.values.toList()
          )

        rtcEngineCommunication.sdpOffer(
          offer.description,
          localEndpoint.tracks.map { (_, track) -> track.webrtcId() to track.metadata }.toMap(),
          offer.midToTrackIdMapping,
          TrackBitratesMapper.mapTracksToProtoBitrates(localEndpoint.tracks)
        )
        peerConnectionManager.onSentSdpOffer()
      } catch (e: Exception) {
        Timber.e(e, "Failed to create an sdp offer")
      }
    }
  }

  override fun onRemoteCandidate(
    candidate: String,
    sdpMLineIndex: Int,
    sdpMid: String
  ) {
    coroutineScope.launch {
      val iceCandidate =
        IceCandidate(
          sdpMid,
          sdpMLineIndex,
          candidate
        )

      peerConnectionManager.onRemoteCandidate(iceCandidate)
    }
  }

  override fun onTracksAdded(
    endpointId: String,
    trackIdToTrack: Map<String, Server.MediaEvent.Track>
  ) {
    if (localEndpoint.id == endpointId) {
      return
    }

    val endpoint =
      remoteEndpoints.remove(endpointId) ?: run {
        Timber.e("Failed to process TracksAdded event: Endpoint not found: $endpointId")
        return
      }

    val updatedTracks = endpoint.tracks.toMutableMap()

    for ((trackId, trackData) in trackIdToTrack) {
      var track = endpoint.tracks.values.firstOrNull { track -> track.getRTCEngineId() == trackId }
      if (track != null) {
        track.metadata = trackData.metadataJson.serializeToMap()
      } else {
        track =
          Track(
            mediaTrack = null,
            sendEncodings = emptyList(),
            endpointId = endpointId,
            rtcEngineId = trackId,
            metadata = trackData.metadataJson.serializeToMap()
          )
        this.listener.onTrackAdded(track)
      }
      updatedTracks[trackId] = track
    }

    val updatedEndpoint = endpoint.copy(tracks = updatedTracks)

    remoteEndpoints[updatedEndpoint.id] = updatedEndpoint
  }

  override fun onTracksRemoved(
    endpointId: String,
    trackIds: List<String>
  ) {
    var endpoint =
      remoteEndpoints[endpointId] ?: run {
        Timber.e("Failed to process TracksRemoved event: Endpoint not found: $endpointId")
        return
      }

    trackIds.forEach { trackId ->
      val track = endpoint.tracks.values.firstOrNull { it.getRTCEngineId() == trackId } ?: return
      endpoint = endpoint.removeTrack(track.id())
      this.listener.onTrackRemoved(track)
    }
    remoteEndpoints[endpointId] = endpoint
  }

  override fun onTrackUpdated(
    endpointId: String,
    trackId: String,
    metadata: Metadata?
  ) {
    val track =
      getTrack(trackId) ?: run {
        Timber.e("Failed to process TrackUpdated event: Track context not found: $trackId")
        return
      }

    track.metadata = metadata ?: mapOf()

    this.listener.onTrackUpdated(track)
  }

  fun onTrackEncodingChanged(
    endpointId: String,
    trackId: String,
    encoding: String,
    encodingReason: String
  ) {
    val encodingReasonEnum = EncodingReason.fromString(encodingReason)
    if (encodingReasonEnum == null) {
      Timber.e("Invalid encoding reason: $encodingReason")
      return
    }
    val track = getTrack(trackId) as? RemoteVideoTrack
    if (track == null) {
      Timber.e("Invalid trackId: $trackId")
      return
    }
    val encodingEnum = TrackEncoding.fromString(encoding)
    if (encodingEnum == null) {
      Timber.e("Invalid encoding: $encoding")
      return
    }
    track.setEncoding(encodingEnum, encodingReasonEnum)
  }

  override fun onVadNotification(
    trackId: String,
    status: Server.MediaEvent.VadNotification.Status
  ) {
    // TODO: I'm not really sure why sometimes we get rtcEngineId and sometimes just trackId
    // so let's check for both for now
    val track =
      getTrackWithRtcEngineId(trackId) as? RemoteAudioTrack ?: getTrack(trackId) as? RemoteAudioTrack ?: run {
        Timber.e("Invalid track id = $trackId")
        return
      }

    if (track.vadStatus != status) {
      track.vadStatus = status
      listener.onTrackUpdated(track)
    }
  }

  override fun onBandwidthEstimation(estimation: Long) {
    listener.onBandwidthEstimationChanged(estimation)
  }

  override fun onAddTrack(
    rtcEngineTrackId: String,
    webrtcTrack: MediaStreamTrack
  ) {
    var track =
      getTrackWithRtcEngineId(rtcEngineTrackId) ?: run {
        Timber.e("onAddTrack: Track context with trackId=$rtcEngineTrackId not found")
        return
      }

    if (track.endpointId == this.localEndpoint.id) {
      return
    }

    val trackId = track.id()

    track =
      when (webrtcTrack) {
        is VideoTrack ->
          RemoteVideoTrack(
            webrtcTrack,
            track.endpointId,
            track.getRTCEngineId(),
            track.metadata,
            trackId
          )

        is AudioTrack ->
          RemoteAudioTrack(
            webrtcTrack,
            track.endpointId,
            track.getRTCEngineId(),
            track.metadata,
            trackId
          )

        else ->
          throw IllegalStateException("invalid type of incoming track")
      }

    remoteEndpoints[track.endpointId] = remoteEndpoints[track.endpointId]!!.addOrReplaceTrack(track)
    listener.onTrackReady(track)
  }

  override fun onLocalIceCandidate(candidate: IceCandidate) {
    coroutineScope.launch {
      val splitSdp = candidate.sdp.split(" ")
      val ufrag = splitSdp[splitSdp.indexOf("ufrag") + 1]
      rtcEngineCommunication.localCandidate(
        candidate.sdp,
        candidate.sdpMLineIndex,
        candidate.sdpMid.toInt(),
        ufrag
      )
    }
  }
}
