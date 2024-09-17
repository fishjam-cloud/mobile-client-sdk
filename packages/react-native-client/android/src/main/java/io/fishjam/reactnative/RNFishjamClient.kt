package io.fishjam.reactnative

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.media.projection.MediaProjectionManager
import androidx.appcompat.app.AppCompatActivity
import com.fishjamcloud.client.FishjamClient
import com.fishjamcloud.client.FishjamClientListener
import com.fishjamcloud.client.media.LocalAudioTrack
import com.fishjamcloud.client.media.LocalScreencastTrack
import com.fishjamcloud.client.media.LocalVideoTrack
import com.fishjamcloud.client.media.RemoteAudioTrack
import com.fishjamcloud.client.media.RemoteVideoTrack
import com.fishjamcloud.client.media.Track
import com.fishjamcloud.client.models.AuthError
import com.fishjamcloud.client.models.Endpoint
import com.fishjamcloud.client.models.Metadata
import com.fishjamcloud.client.models.Peer
import com.fishjamcloud.client.models.RTCInboundStats
import com.fishjamcloud.client.models.RTCOutboundStats
import com.fishjamcloud.client.models.ReconnectConfig
import com.fishjamcloud.client.models.SimulcastConfig
import com.fishjamcloud.client.models.TrackBandwidthLimit
import com.fishjamcloud.client.models.VideoParameters
import com.twilio.audioswitch.AudioDevice
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import org.webrtc.Logging

class RNFishjamClient(
  val sendEvent: (name: String, data: Map<String, Any?>) -> Unit
) : FishjamClientListener {
  private val SCREENCAST_REQUEST = 1

  var isMicrophoneOn = false
  var isCameraOn = false
  var isScreencastOn = false
  var isConnected = false

  private var connectPromise: Promise? = null
  private var screencastPermissionPromise: Promise? = null

  var videoSimulcastConfig: SimulcastConfig = SimulcastConfig()
  private var localUserMetadata: Metadata = mutableMapOf()

  var screencastQuality: String? = null
  var screencastSimulcastConfig: SimulcastConfig = SimulcastConfig()
  var screencastMaxBandwidth: TrackBandwidthLimit = TrackBandwidthLimit.BandwidthLimit(0)

  var screencastMetadata: Map<String, Any> = mutableMapOf()

  private var mediaProjectionIntent: Intent? = null

  var audioSwitchManager: AudioSwitchManager? = null

  var appContext: AppContext? = null

  interface OnTrackUpdateListener {
    fun onTracksUpdate()
  }

  interface OnLocalTrackSwitchListener {
    suspend fun onLocalTrackWillSwitch()

    suspend fun onLocalTrackSwitched()
  }

  companion object {
    var onTracksUpdateListeners: MutableList<OnTrackUpdateListener> = mutableListOf()
    val onLocalTrackSwitchListener: MutableList<OnLocalTrackSwitchListener> = mutableListOf()
    lateinit var fishjamClient: FishjamClient

    fun getAllPeers(): List<Peer> {
      val listOfPeers = fishjamClient.getRemotePeers().toMutableList()
      val localEndpoint = fishjamClient.getLocalEndpoint()
      listOfPeers.add(localEndpoint)
      return listOfPeers
    }
  }

  fun onModuleCreate(appContext: AppContext) {
    this.appContext = appContext
    this.audioSwitchManager = AudioSwitchManager(appContext.reactContext!!)
    create()
  }

  fun onModuleDestroy() {
    audioSwitchManager?.stop()
  }

  private val coroutineScope: CoroutineScope =
    CoroutineScope(SupervisorJob() + Dispatchers.Default)

  fun onActivityResult(
    requestCode: Int,
    resultCode: Int,
    data: Intent?
  ) {
    coroutineScope.launch(Dispatchers.Main) {
      if (requestCode != SCREENCAST_REQUEST) return@launch
      if (resultCode != Activity.RESULT_OK) {
        screencastPermissionPromise?.resolve("denied")
        screencastPermissionPromise = null
        return@launch
      }

      mediaProjectionIntent = data
      screencastPermissionPromise?.resolve("granted")
      screencastPermissionPromise = null
    }
  }

  private fun getSimulcastConfigFromOptions(simulcastConfigMap: io.fishjam.reactnative.SimulcastConfig): SimulcastConfig {
    val simulcastEnabled = simulcastConfigMap.enabled
    val activeEncodings = simulcastConfigMap.activeEncodings.map { e -> e.toTrackEncoding() }
    return SimulcastConfig(
      enabled = simulcastEnabled,
      activeEncodings = activeEncodings
    )
  }

  private fun getMaxBandwidthFromOptions(
    maxBandwidthMap: Map<String, Int>?,
    maxBandwidthInt: Int
  ): TrackBandwidthLimit {
    if (maxBandwidthMap != null) {
      val maxBandwidthSimulcast = mutableMapOf<String, TrackBandwidthLimit.BandwidthLimit>()
      maxBandwidthMap.forEach {
        maxBandwidthSimulcast[it.key] = TrackBandwidthLimit.BandwidthLimit(it.value)
      }
      return TrackBandwidthLimit.SimulcastBandwidthLimit(maxBandwidthSimulcast)
    }
    return TrackBandwidthLimit.BandwidthLimit(maxBandwidthInt)
  }

  private fun create() {
    audioSwitchManager = AudioSwitchManager(appContext?.reactContext!!)
    fishjamClient =
      FishjamClient(
        appContext = appContext?.reactContext!!,
        listener = this
      )
  }

  private fun getVideoParametersFromOptions(createOptions: CameraConfig): VideoParameters {
    val videoMaxBandwidth =
      getMaxBandwidthFromOptions(createOptions.maxBandwidthMap, createOptions.maxBandwidthInt)
    var videoParameters =
      when (createOptions.quality) {
        "QVGA169" -> VideoParameters.presetQVGA169
        "VGA169" -> VideoParameters.presetVGA169
        "QHD169" -> VideoParameters.presetQHD169
        "HD169" -> VideoParameters.presetHD169
        "FHD169" -> VideoParameters.presetFHD169
        "QVGA43" -> VideoParameters.presetQVGA43
        "VGA43" -> VideoParameters.presetVGA43
        "QHD43" -> VideoParameters.presetQHD43
        "HD43" -> VideoParameters.presetHD43
        "FHD43" -> VideoParameters.presetFHD43
        else -> VideoParameters.presetVGA169
      }
    videoParameters =
      videoParameters.copy(
        dimensions = if (createOptions.flipVideo) videoParameters.dimensions.flip() else videoParameters.dimensions,
        simulcastConfig = getSimulcastConfigFromOptions(createOptions.simulcastConfig),
        maxBitrate = videoMaxBandwidth
      )
    return videoParameters
  }

  private fun getLocalVideoTrack(): LocalVideoTrack? =
    fishjamClient
      .getLocalEndpoint()
      .tracks
      .values
      .filterIsInstance<LocalVideoTrack>()
      .firstOrNull()

  private fun getLocalAudioTrack(): LocalAudioTrack? =
    fishjamClient
      .getLocalEndpoint()
      .tracks
      .values
      .filterIsInstance<LocalAudioTrack>()
      .firstOrNull()

  private fun getLocalScreencastTrack(): LocalScreencastTrack? =
    fishjamClient
      .getLocalEndpoint()
      .tracks
      .values
      .filterIsInstance<LocalScreencastTrack>()
      .firstOrNull()

  private fun ensureConnected() {
    if (!isConnected) {
      throw ClientNotConnectedError()
    }
  }

  private fun ensureVideoTrack() {
    if (getLocalVideoTrack() == null) {
      throw NoLocalVideoTrackError()
    }
  }

  private fun ensureAudioTrack() {
    if (getLocalAudioTrack() == null) {
      throw NoLocalAudioTrackError()
    }
  }

  private fun ensureScreencastTrack() {
    if (getLocalScreencastTrack() == null) {
      throw NoScreencastTrackError()
    }
  }

  override fun onAuthError(reason: AuthError) {
    CoroutineScope(Dispatchers.Main).launch {
      connectPromise?.reject(ConnectionError(reason))
      connectPromise = null
    }
  }

  fun joinRoom(
    url: String,
    participantToken: String,
    participantMetadata: Map<String, Any>,
    config: ConnectConfig,
    promise: Promise
  ) {
    connectPromise = promise
    localUserMetadata = participantMetadata
    fishjamClient.connect(
      com.fishjamcloud.client.ConnectConfig(
        url,
        participantToken,
        participantMetadata,
        ReconnectConfig(
          config.reconnectConfig.maxAttempts,
          config.reconnectConfig.initialDelayMs,
          config.reconnectConfig.delayMs
        )
      )
    )
  }

  fun leaveRoom() {
    if (isScreencastOn) {
      stopScreencast()
    }
    isMicrophoneOn = false
    isCameraOn = false
    isScreencastOn = false
    isConnected = false
    fishjamClient.leave()
  }

  suspend fun startCamera(config: CameraConfig) {
    val cameraTrack = createCameraTrack(config)
    setCameraTrackState(cameraTrack, config.cameraEnabled)
    emitEndpoints()
  }

  private suspend fun createCameraTrack(config: CameraConfig): LocalVideoTrack {
    val videoParameters = getVideoParametersFromOptions(config)
    videoSimulcastConfig = getSimulcastConfigFromOptions(config.simulcastConfig)
    return fishjamClient.createVideoTrack(
      videoParameters,
      config.videoTrackMetadata,
      config.cameraId
    )
  }

  private fun setCameraTrackState(
    cameraTrack: LocalVideoTrack,
    isEnabled: Boolean
  ) {
    cameraTrack.setEnabled(isEnabled)
    isCameraOn = isEnabled
    val eventName = EmitableEvents.IsCameraOn
    val isCameraOnMap = mapOf(eventName to isEnabled)
    emitEvent(eventName, isCameraOnMap)
  }

  fun toggleCamera(): Boolean {
    ensureVideoTrack()
    getLocalVideoTrack()?.let { setCameraTrackState(it, !isCameraOn) }
    return isCameraOn
  }

  suspend fun flipCamera() {
    ensureVideoTrack()
    onLocalTrackSwitchListener.forEach { it.onLocalTrackWillSwitch() }
    getLocalVideoTrack()?.flipCamera()
    onLocalTrackSwitchListener.forEach { it.onLocalTrackSwitched() }
  }

  suspend fun switchCamera(cameraId: String) {
    ensureVideoTrack()
    onLocalTrackSwitchListener.forEach { it.onLocalTrackWillSwitch() }
    getLocalVideoTrack()?.switchCamera(cameraId)
    onLocalTrackSwitchListener.forEach {
      it.onLocalTrackSwitched()
    }
  }

  private suspend fun startMicrophone() {
    val microphoneTrack = fishjamClient.createAudioTrack(emptyMap())
    setMicrophoneTrackState(microphoneTrack, true)
    emitEndpoints()
  }

  private fun setMicrophoneTrackState(
    microphoneTrack: LocalAudioTrack,
    isEnabled: Boolean
  ) {
    microphoneTrack.setEnabled(isEnabled)
    isMicrophoneOn = isEnabled
    val eventName = EmitableEvents.IsMicrophoneOn
    val isMicrophoneOnMap = mapOf(eventName to isEnabled)
    emitEvent(eventName, isMicrophoneOnMap)
  }

  suspend fun toggleMicrophone(): Boolean {
    if (getLocalAudioTrack() == null) {
      startMicrophone()
    } else {
      getLocalAudioTrack()?.let { setMicrophoneTrackState(it, !isMicrophoneOn) }
    }
    return isMicrophoneOn
  }

  fun handleScreencastPermission(promise: Promise) {
    screencastPermissionPromise = promise
    if (!isScreencastOn) {
      ensureConnected()
      val currentActivity = appContext?.currentActivity ?: throw ActivityNotFoundException()

      val mediaProjectionManager =
        appContext?.reactContext!!.getSystemService(
          AppCompatActivity.MEDIA_PROJECTION_SERVICE
        ) as MediaProjectionManager
      val intent = mediaProjectionManager.createScreenCaptureIntent()
      currentActivity.startActivityForResult(intent, SCREENCAST_REQUEST)
    }
  }

  suspend fun toggleScreencast(screencastOptions: ScreencastOptions) {
    this.screencastMetadata = screencastOptions.screencastMetadata
    this.screencastQuality = screencastOptions.quality
    this.screencastSimulcastConfig =
      getSimulcastConfigFromOptions(screencastOptions.simulcastConfig)
    this.screencastMaxBandwidth =
      getMaxBandwidthFromOptions(
        screencastOptions.maxBandwidthMap,
        screencastOptions.maxBandwidthInt
      )
    if (!isScreencastOn) {
      ensureConnected()
      startScreencast()
    } else {
      stopScreencast()
    }
  }

  fun getPeers(): List<Map<String, Any?>> =
    getAllPeers().map { endpoint ->
      mapOf(
        "id" to endpoint.id,
        "isLocal" to (endpoint.id == fishjamClient.getLocalEndpoint().id),
        "type" to endpoint.type,
        "metadata" to endpoint.metadata,
        "tracks" to
          endpoint.tracks.values.mapNotNull { track ->
            when (track) {
              is RemoteVideoTrack ->
                mapOf(
                  "id" to track.id(),
                  "type" to "Video",
                  "metadata" to track.metadata,
                  "encoding" to track.encoding?.rid,
                  "encodingReason" to track.encodingReason?.value
                )

              is RemoteAudioTrack ->
                mapOf(
                  "id" to track.id(),
                  "type" to "Audio",
                  "metadata" to track.metadata,
                  "vadStatus" to track.vadStatus.value
                )

              is LocalVideoTrack ->
                mapOf(
                  "id" to track.id(),
                  "type" to "Video",
                  "metadata" to track.metadata
                )

              is LocalScreencastTrack ->
                mapOf(
                  "id" to track.id(),
                  "type" to "Video",
                  "metadata" to track.metadata
                )

              is LocalAudioTrack ->
                mapOf(
                  "id" to track.id(),
                  "type" to "Audio",
                  "metadata" to track.metadata
                )

              else -> {
                null
              }
            }
          }
      )
    }

  fun getCaptureDevices(): List<Map<String, Any>> {
    val devices = LocalVideoTrack.getCaptureDevices(appContext?.reactContext!!)
    return devices.map { device ->
      mapOf<String, Any>(
        "id" to device.deviceName,
        "name" to device.deviceName,
        "facingDirection" to
          when (true) {
            device.isFrontFacing -> "front"
            device.isBackFacing -> "back"
            else -> "unspecified"
          }
      )
    }
  }

  fun updatePeerMetadata(metadata: Metadata) {
    ensureConnected()
    fishjamClient.updatePeerMetadata(metadata)
  }

  private fun updateTrackMetadata(
    trackId: String,
    metadata: Metadata
  ) {
    fishjamClient.updateTrackMetadata(trackId, metadata)
    emitEndpoints()
  }

  fun updateLocalVideoTrackMetadata(metadata: Metadata) {
    ensureVideoTrack()
    getLocalVideoTrack()?.let {
      updateTrackMetadata(it.id(), metadata)
    }
  }

  fun updateLocalAudioTrackMetadata(metadata: Metadata) {
    ensureAudioTrack()
    getLocalAudioTrack()?.let {
      updateTrackMetadata(it.id(), metadata)
    }
  }

  fun updateLocalScreencastTrackMetadata(metadata: Metadata) {
    ensureScreencastTrack()
    getLocalScreencastTrack()?.let {
      updateTrackMetadata(it.id(), metadata)
    }
  }

  fun setOutputAudioDevice(audioDevice: String) {
    audioSwitchManager?.selectAudioOutput(AudioDeviceKind.fromTypeName(audioDevice))
  }

  fun startAudioSwitcher() {
    audioSwitchManager?.let {
      it.start(this::emitAudioDeviceEvent)
      emitAudioDeviceEvent(
        it.availableAudioDevices(),
        it.selectedAudioDevice()
      )
    }
  }

  fun stopAudioSwitcher() {
    audioSwitchManager?.stop()
  }

  private fun toggleTrackEncoding(
    encoding: String,
    trackId: String,
    simulcastConfig: SimulcastConfig
  ): SimulcastConfig {
    val trackEncoding = encoding.toTrackEncoding()

    val isTrackEncodingActive = simulcastConfig.activeEncodings.contains(trackEncoding)

    if (isTrackEncodingActive) {
      fishjamClient.disableTrackEncoding(trackId, trackEncoding)
    } else {
      fishjamClient.enableTrackEncoding(trackId, trackEncoding)
    }

    val updatedActiveEncodings =
      if (isTrackEncodingActive) {
        simulcastConfig.activeEncodings.filter { it != trackEncoding }
      } else {
        simulcastConfig.activeEncodings + trackEncoding
      }

    return SimulcastConfig(
      enabled = true,
      activeEncodings = updatedActiveEncodings
    )
  }

  fun toggleScreencastTrackEncoding(encoding: String): Map<String, Any> {
    ensureScreencastTrack()
    getLocalScreencastTrack()?.let {
      screencastSimulcastConfig = toggleTrackEncoding(encoding, it.id(), screencastSimulcastConfig)
    }
    return getSimulcastConfigAsRNMap(screencastSimulcastConfig)
  }

  fun setScreencastTrackBandwidth(bandwidth: Int) {
    ensureScreencastTrack()
    getLocalScreencastTrack()?.let {
      fishjamClient.setTrackBandwidth(it.id(), TrackBandwidthLimit.BandwidthLimit(bandwidth))
    }
  }

  fun setScreencastTrackEncodingBandwidth(
    encoding: String,
    bandwidth: Int
  ) {
    ensureScreencastTrack()
    getLocalScreencastTrack()?.let {
      fishjamClient.setEncodingBandwidth(
        it.id(),
        encoding,
        TrackBandwidthLimit.BandwidthLimit(bandwidth)
      )
    }
  }

  fun setTargetTrackEncoding(
    trackId: String,
    encoding: String
  ) {
    ensureConnected()
    fishjamClient.setTargetTrackEncoding(trackId, encoding.toTrackEncoding())
  }

  fun toggleVideoTrackEncoding(encoding: String): Map<String, Any> {
    ensureVideoTrack()
    val trackId = getLocalVideoTrack()?.id() ?: return emptyMap()
    videoSimulcastConfig = toggleTrackEncoding(encoding, trackId, videoSimulcastConfig)
    val eventName = EmitableEvents.SimulcastConfigUpdate
    emitEvent(eventName, getSimulcastConfigAsRNMap(videoSimulcastConfig))
    return getSimulcastConfigAsRNMap(videoSimulcastConfig)
  }

  fun setVideoTrackEncodingBandwidth(
    encoding: String,
    bandwidth: Int
  ) {
    ensureVideoTrack()
    getLocalVideoTrack()?.let {
      fishjamClient.setEncodingBandwidth(
        it.id(),
        encoding,
        TrackBandwidthLimit.BandwidthLimit(bandwidth)
      )
    }
  }

  fun setVideoTrackBandwidth(bandwidth: Int) {
    ensureVideoTrack()
    getLocalVideoTrack()?.let {
      fishjamClient.setTrackBandwidth(it.id(), TrackBandwidthLimit.BandwidthLimit(bandwidth))
    }
  }

  fun changeWebRTCLoggingSeverity(severity: String) {
    when (severity) {
      "verbose" -> fishjamClient.changeWebRTCLoggingSeverity(Logging.Severity.LS_VERBOSE)

      "info" -> fishjamClient.changeWebRTCLoggingSeverity(Logging.Severity.LS_INFO)

      "error" -> fishjamClient.changeWebRTCLoggingSeverity(Logging.Severity.LS_ERROR)

      "warning" -> fishjamClient.changeWebRTCLoggingSeverity(Logging.Severity.LS_WARNING)

      "none" -> fishjamClient.changeWebRTCLoggingSeverity(Logging.Severity.LS_NONE)

      else -> {
        throw CodedException("Severity with name=$severity not found")
      }
    }
  }

  private fun rtcOutboundStatsToRNMap(stats: RTCOutboundStats): Map<String, Any?> {
    val innerMap = mutableMapOf<String, Double>()
    innerMap["bandwidth"] = stats.qualityLimitationDurations?.bandwidth ?: 0.0
    innerMap["cpu"] = stats.qualityLimitationDurations?.cpu ?: 0.0
    innerMap["none"] = stats.qualityLimitationDurations?.none ?: 0.0
    innerMap["other"] = stats.qualityLimitationDurations?.other ?: 0.0

    val res = mutableMapOf<String, Any?>()
    res["kind"] = stats.kind
    res["rid"] = stats.rid
    res["bytesSent"] = stats.bytesSent?.toInt() ?: 0
    res["targetBitrate"] = stats.targetBitrate ?: 0.0
    res["packetsSent"] = stats.packetsSent?.toInt() ?: 0
    res["framesEncoded"] = stats.framesEncoded?.toInt() ?: 0
    res["framesPerSecond"] = stats.framesPerSecond ?: 0.0
    res["frameWidth"] = stats.frameWidth?.toInt() ?: 0
    res["frameHeight"] = stats.frameHeight?.toInt() ?: 0
    res["qualityLimitationDurations"] = innerMap

    return res
  }

  private fun rtcInboundStatsToRNMap(stats: RTCInboundStats): Map<String, Any?> {
    val res = mutableMapOf<String, Any?>()
    res["kind"] = stats.kind
    res["jitter"] = stats.jitter ?: 0.0
    res["packetsLost"] = stats.packetsLost ?: 0
    res["packetsReceived"] = stats.packetsReceived?.toInt() ?: 0
    res["bytesReceived"] = stats.bytesReceived?.toInt() ?: 0
    res["framesReceived"] = stats.framesReceived ?: 0
    res["frameWidth"] = stats.frameWidth?.toInt() ?: 0
    res["frameHeight"] = stats.frameHeight?.toInt() ?: 0
    res["framesPerSecond"] = stats.framesPerSecond ?: 0.0
    res["framesDropped"] = stats.framesDropped?.toInt() ?: 0

    return res
  }

  fun getStatistics(): MutableMap<String, Map<String, Any?>> {
    val newMap = mutableMapOf<String, Map<String, Any?>>()
    fishjamClient.getStats().forEach { entry ->
      newMap[entry.key] =
        if (entry.value is RTCInboundStats) {
          rtcInboundStatsToRNMap(
            entry.value as RTCInboundStats
          )
        } else {
          rtcOutboundStatsToRNMap(entry.value as RTCOutboundStats)
        }
    }
    return newMap
  }

  private suspend fun startScreencast() {
    val videoParameters = getScreencastVideoParameters()
    if (mediaProjectionIntent == null) {
      throw MissingScreencastPermission()
    }
    fishjamClient.createScreencastTrack(
      mediaProjectionIntent!!,
      videoParameters,
      screencastMetadata
    )
    mediaProjectionIntent = null

    setScreencastTrackState(true)
    emitEndpoints()
  }

  private fun getScreencastVideoParameters(): VideoParameters {
    val videoParameters =
      when (screencastQuality) {
        "VGA" -> VideoParameters.presetScreenShareVGA
        "HD5" -> VideoParameters.presetScreenShareHD5
        "HD15" -> VideoParameters.presetScreenShareHD15
        "FHD15" -> VideoParameters.presetScreenShareFHD15
        "FHD30" -> VideoParameters.presetScreenShareFHD30
        else -> VideoParameters.presetScreenShareHD15
      }
    val dimensions = videoParameters.dimensions.flip()
    return videoParameters.copy(
      dimensions = dimensions,
      simulcastConfig = screencastSimulcastConfig,
      maxBitrate = screencastMaxBandwidth
    )
  }

  private fun setScreencastTrackState(isEnabled: Boolean) {
    isScreencastOn = isEnabled
    val eventName = EmitableEvents.IsScreencastOn
    emitEvent(eventName, mapOf(eventName to isEnabled))
  }

  private fun stopScreencast() {
    ensureScreencastTrack()
    coroutineScope.launch {
      val screencastTrack =
        fishjamClient.getLocalEndpoint().tracks.values.first { track ->
          track is LocalScreencastTrack
        } as? LocalScreencastTrack
      if (screencastTrack != null) {
        fishjamClient.removeTrack(screencastTrack.id())
      }
      setScreencastTrackState(false)
      emitEndpoints()
    }
  }

  private fun emitEvent(
    eventName: String,
    data: Map<String, Any?>
  ) {
    sendEvent(eventName, data)
  }

  private fun emitEndpoints() {
    val eventName = EmitableEvents.PeersUpdate
    val map = mapOf(eventName to getPeers())
    emitEvent(eventName, map)
  }

  private fun audioDeviceAsRNMap(audioDevice: AudioDevice): Map<String, String?> =
    mapOf(
      "name" to audioDevice.name,
      "type" to AudioDeviceKind.fromAudioDevice(audioDevice)?.typeName
    )

  private fun emitAudioDeviceEvent(
    audioDevices: List<AudioDevice>,
    selectedDevice: AudioDevice?
  ) {
    val eventName = EmitableEvents.AudioDeviceUpdate
    val map =
      mapOf(
        eventName to
          mapOf(
            "selectedDevice" to (
              if (selectedDevice != null) {
                audioDeviceAsRNMap(
                  selectedDevice
                )
              } else {
                null
              }
            ),
            "availableDevices" to
              audioDevices.map { audioDevice ->
                audioDeviceAsRNMap(
                  audioDevice
                )
              }
          )
      )

    emitEvent(eventName, map)
  }

  private fun getSimulcastConfigAsRNMap(simulcastConfig: SimulcastConfig): Map<String, Any> =
    mapOf(
      "enabled" to simulcastConfig.enabled,
      "activeEncodings" to
        simulcastConfig.activeEncodings.map {
          it.rid
        }
    )

  override fun onJoined(
    peerID: String,
    peersInRoom: MutableMap<String, Endpoint>
  ) {
    CoroutineScope(Dispatchers.Main).launch {
      isConnected = true
      connectPromise?.resolve(null)
      connectPromise = null
      emitEndpoints()
    }
  }

  override fun onJoinError(metadata: Any) {
    CoroutineScope(Dispatchers.Main).launch {
      connectPromise?.reject(JoinError(metadata))
      connectPromise = null
    }
  }

  private fun addOrUpdateTrack(track: Track) {
    emitEndpoints()
    onTracksUpdateListeners.forEach { it.onTracksUpdate() }
  }

  override fun onTrackReady(track: Track) {
    CoroutineScope(Dispatchers.Main).launch {
      addOrUpdateTrack(track)
    }
  }

  override fun onTrackAdded(track: Track) {}

  override fun onTrackRemoved(track: Track) {
    CoroutineScope(Dispatchers.Main).launch {
      emitEndpoints()
    }
  }

  override fun onTrackUpdated(track: Track) {
    CoroutineScope(Dispatchers.Main).launch {
      emitEndpoints()
    }
  }

  override fun onPeerJoined(peer: Peer) {
    CoroutineScope(Dispatchers.Main).launch {
      emitEndpoints()
    }
  }

  override fun onPeerLeft(peer: Peer) {
    CoroutineScope(Dispatchers.Main).launch {
      emitEndpoints()
    }
  }

  override fun onPeerUpdated(peer: Peer) {}

  override fun onBandwidthEstimationChanged(estimation: Long) {
    val eventName = EmitableEvents.BandwidthEstimation
    emitEvent(eventName, mapOf(eventName to estimation.toFloat()))
  }

  override fun onDisconnected() {}

  override fun onSocketClose(
    code: Int,
    reason: String
  ) {
    CoroutineScope(Dispatchers.Main).launch {
      connectPromise?.reject(SocketClosedError(code, reason))
      connectPromise = null
    }
  }

  override fun onSocketError(t: Throwable) {
    CoroutineScope(Dispatchers.Main).launch {
      connectPromise?.reject(SocketError(t.message ?: t.toString()))
      connectPromise = null
    }
  }

  override fun onReconnected() {
    emitEvent(EmitableEvents.Reconnected, emptyMap())
  }

  override fun onReconnectionStarted() {
    emitEvent(EmitableEvents.ReconnectionStarted, emptyMap())
  }

  override fun onReconnectionRetriesLimitReached() {
    emitEvent(EmitableEvents.ReconnectionRetriesLimitReached, emptyMap())
  }
}
