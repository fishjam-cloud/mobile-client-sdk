package io.fishjam.reactnative

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.media.projection.MediaProjectionManager
import androidx.appcompat.app.AppCompatActivity
import com.fishjamcloud.client.FishjamClient
import com.fishjamcloud.client.FishjamClientListener
import com.fishjamcloud.client.media.LocalAudioTrack
import com.fishjamcloud.client.media.LocalScreenShareTrack
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
import io.fishjam.reactnative.managers.LocalCameraTracksChangedListenersManager
import io.fishjam.reactnative.managers.LocalTracksSwitchListenersManager
import io.fishjam.reactnative.managers.TracksUpdateListenersManager
import io.fishjam.reactnative.utils.PermissionUtils
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import org.webrtc.Logging

class RNFishjamClient(
  val sendEvent: (name: String, data: Map<String, Any?>) -> Unit
) : FishjamClientListener {
  private val SCREENSHARE_REQUEST = 1

  var isMicrophoneOn = false
  var isCameraOn = false
  var isScreenShareOn = false
  var isConnected = false

  private var isCameraInitialized = false

  private var connectPromise: Promise? = null
  private var screenSharePermissionPromise: Promise? = null

  var videoSimulcastConfig: SimulcastConfig = SimulcastConfig()
  private var localUserMetadata: Metadata = mutableMapOf()

  var screenShareQuality: String? = null
  var screenShareSimulcastConfig: SimulcastConfig = SimulcastConfig()
  var screenShareMaxBandwidth: TrackBandwidthLimit = TrackBandwidthLimit.BandwidthLimit(0)

  var screenShareMetadata: Map<String, Any> = mutableMapOf()

  private var mediaProjectionIntent: Intent? = null

  var audioSwitchManager: AudioSwitchManager? = null

  var appContext: AppContext? = null

  var peerStatus = PeerStatus.idle
    private set(value) {
      field = value
      val event = EmitableEvents.PeerStatusChanged
      emitEvent(event, mapOf(event.name to value))
    }

  companion object {
    val trackUpdateListenersManager = TracksUpdateListenersManager()

    val localTracksSwitchListenerManager = LocalTracksSwitchListenersManager()

    val localCameraTracksChangedListenersManager = LocalCameraTracksChangedListenersManager()

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
      if (requestCode != SCREENSHARE_REQUEST) return@launch
      if (resultCode != Activity.RESULT_OK) {
        screenSharePermissionPromise?.resolve("denied")
        screenSharePermissionPromise = null
        return@launch
      }

      mediaProjectionIntent = data
      screenSharePermissionPromise?.resolve("granted")
      screenSharePermissionPromise = null
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
        dimensions = if (createOptions.flipDimensions) videoParameters.dimensions.flip() else videoParameters.dimensions,
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

  private fun getLocalScreenShareTrack(): LocalScreenShareTrack? =
    fishjamClient
      .getLocalEndpoint()
      .tracks
      .values
      .filterIsInstance<LocalScreenShareTrack>()
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

  private fun ensureScreenShareTrack() {
    if (getLocalScreenShareTrack() == null) {
      throw NoScreenShareTrackError()
    }
  }

  override fun onAuthError(reason: AuthError) {
    CoroutineScope(Dispatchers.Main).launch {
      connectPromise?.reject(ConnectionError(reason))
      connectPromise = null
      peerStatus = PeerStatus.error
    }
  }

  fun joinRoom(
    url: String,
    peerToken: String,
    peerMetadata: Map<String, Any>,
    config: ConnectConfig,
    promise: Promise
  ) {
    peerStatus = PeerStatus.connecting
    connectPromise = promise
    localUserMetadata = peerMetadata
    fishjamClient.connect(
      com.fishjamcloud.client.ConnectConfig(
        url,
        peerToken,
        peerMetadata,
        ReconnectConfig(
          config.reconnectConfig.maxAttempts,
          config.reconnectConfig.initialDelayMs,
          config.reconnectConfig.delayMs
        )
      )
    )
  }

  fun leaveRoom() {
    if (isScreenShareOn) {
      stopScreenShare()
    }
    isMicrophoneOn = false
    isCameraOn = false
    isScreenShareOn = false
    isConnected = false
    isCameraInitialized = false
    fishjamClient.leave {
      emitEndpoints()
    }
  }

  suspend fun startCamera(config: CameraConfig) {
    if (isCameraInitialized) {
      emitWarning("Camera already started. You may only call startCamera once before leaveRoom is called.")
      return
    }
    if (!PermissionUtils.requestCameraPermission(appContext)) {
      emitWarning("Camera permission not granted.")
      return
    }

    val cameraTrack = createCameraTrack(config)
    setCameraTrackState(cameraTrack, config.cameraEnabled)
    emitEndpoints()
    isCameraInitialized = true
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
    val event = EmitableEvents.IsCameraOn
    emitEvent(event, mapOf(event.name to isEnabled))
    localCameraTracksChangedListenersManager.notifyListeners()
  }

  fun toggleCamera(): Boolean {
    ensureVideoTrack()
    getLocalVideoTrack()?.let { setCameraTrackState(it, !isCameraOn) }
    return isCameraOn
  }

  suspend fun flipCamera() {
    ensureVideoTrack()
    localTracksSwitchListenerManager.notifyWillSwitch()
    getLocalVideoTrack()?.flipCamera()
    localTracksSwitchListenerManager.notifySwitched()
  }

  suspend fun switchCamera(cameraId: String) {
    ensureVideoTrack()
    localTracksSwitchListenerManager.notifyWillSwitch()
    getLocalVideoTrack()?.switchCamera(cameraId)
    localTracksSwitchListenerManager.notifySwitched()
  }

  private suspend fun startMicrophone() {
    if (!PermissionUtils.requestMicrophonePermission(appContext)) {
      emitWarning("Microphone permission not granted.")
      return
    }

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
    val event = EmitableEvents.IsMicrophoneOn
    emitEvent(event, mapOf(event.name to isEnabled))
  }

  suspend fun toggleMicrophone(): Boolean {
    if (getLocalAudioTrack() == null) {
      startMicrophone()
    } else {
      getLocalAudioTrack()?.let { setMicrophoneTrackState(it, !isMicrophoneOn) }
    }
    return isMicrophoneOn
  }

  fun handleScreenSharePermission(promise: Promise) {
    screenSharePermissionPromise = promise
    if (!isScreenShareOn) {
      ensureConnected()
      val currentActivity = appContext?.currentActivity ?: throw ActivityNotFoundException()

      val mediaProjectionManager =
        appContext?.reactContext!!.getSystemService(
          AppCompatActivity.MEDIA_PROJECTION_SERVICE
        ) as MediaProjectionManager
      val intent = mediaProjectionManager.createScreenCaptureIntent()
      currentActivity.startActivityForResult(intent, SCREENSHARE_REQUEST)
    }
  }

  suspend fun toggleScreenShare(screenShareOptions: ScreenShareOptions) {
    this.screenShareMetadata = screenShareOptions.screenShareMetadata
    this.screenShareQuality = screenShareOptions.quality
    this.screenShareSimulcastConfig =
      getSimulcastConfigFromOptions(screenShareOptions.simulcastConfig)
    this.screenShareMaxBandwidth =
      getMaxBandwidthFromOptions(
        screenShareOptions.maxBandwidthMap,
        screenShareOptions.maxBandwidthInt
      )
    if (!isScreenShareOn) {
      ensureConnected()
      startScreenShare()
    } else {
      stopScreenShare()
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

              is LocalScreenShareTrack ->
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

  fun updateLocalScreenShareTrackMetadata(metadata: Metadata) {
    ensureScreenShareTrack()
    getLocalScreenShareTrack()?.let {
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

  fun toggleScreenShareTrackEncoding(encoding: String): Map<String, Any> {
    ensureScreenShareTrack()
    getLocalScreenShareTrack()?.let {
      screenShareSimulcastConfig = toggleTrackEncoding(encoding, it.id(), screenShareSimulcastConfig)
    }
    return getSimulcastConfigAsRNMap(screenShareSimulcastConfig)
  }

  fun setScreenShareTrackBandwidth(bandwidth: Int) {
    ensureScreenShareTrack()
    getLocalScreenShareTrack()?.let {
      fishjamClient.setTrackBandwidth(it.id(), TrackBandwidthLimit.BandwidthLimit(bandwidth))
    }
  }

  fun setScreenShareTrackEncodingBandwidth(
    encoding: String,
    bandwidth: Int
  ) {
    ensureScreenShareTrack()
    getLocalScreenShareTrack()?.let {
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

  private suspend fun startScreenShare() {
    val videoParameters = getScreenShareVideoParameters()
    if (mediaProjectionIntent == null) {
      throw MissingScreenSharePermission()
    }
    fishjamClient.createScreenShareTrack(
      mediaProjectionIntent!!,
      videoParameters,
      screenShareMetadata
    )
    mediaProjectionIntent = null

    setScreenShareTrackState(true)
    emitEndpoints()
  }

  private fun getScreenShareVideoParameters(): VideoParameters {
    val videoParameters =
      when (screenShareQuality) {
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
      simulcastConfig = screenShareSimulcastConfig,
      maxBitrate = screenShareMaxBandwidth
    )
  }

  private fun setScreenShareTrackState(isEnabled: Boolean) {
    isScreenShareOn = isEnabled
    val event = EmitableEvents.IsScreenShareOn
    emitEvent(event, mapOf(event.name to isEnabled))
  }

  private fun stopScreenShare() {
    ensureScreenShareTrack()
    coroutineScope.launch {
      val screenShareTrack =
        fishjamClient.getLocalEndpoint().tracks.values.first { track ->
          track is LocalScreenShareTrack
        } as? LocalScreenShareTrack
      if (screenShareTrack != null) {
        fishjamClient.removeTrack(screenShareTrack.id())
      }
      setScreenShareTrackState(false)
      emitEndpoints()
    }
  }

  private fun emitEvent(
    event: EmitableEvents,
    data: Map<String, Any?> = mapOf()
  ) {
    CoroutineScope(Dispatchers.Main).launch {
      sendEvent(event.name, data)
    }
  }

  fun emitWarning(warning: String) {
    emitEvent(EmitableEvents.Warning, mapOf("message" to warning))
  }

  private fun emitEndpoints() {
    val event = EmitableEvents.PeersUpdate
    emitEvent(event, mapOf(event.name to getPeers()))
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
    val event = EmitableEvents.AudioDeviceUpdate
    emitEvent(
      event,
      mapOf(
        event.name to
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
    )
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
      peerStatus = PeerStatus.connected
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
    trackUpdateListenersManager.notifyListeners()
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
    val event = EmitableEvents.BandwidthEstimation
    emitEvent(event, mapOf(event.name to estimation.toFloat()))
  }

  override fun onDisconnected() {
    peerStatus = PeerStatus.idle
  }

  override fun onSocketClose(
    code: Int,
    reason: String
  ) {
    CoroutineScope(Dispatchers.Main).launch {
      connectPromise?.reject(SocketClosedError(code, reason))
      connectPromise = null
      peerStatus = PeerStatus.error
    }
  }

  override fun onSocketError(t: Throwable) {
    CoroutineScope(Dispatchers.Main).launch {
      connectPromise?.reject(SocketError(t.message ?: t.toString()))
      connectPromise = null
    }
  }

  override fun onReconnected() {
    emitEvent(EmitableEvents.Reconnected)
  }

  override fun onReconnectionStarted() {
    emitEvent(EmitableEvents.ReconnectionStarted)
  }

  override fun onReconnectionRetriesLimitReached() {
    emitEvent(EmitableEvents.ReconnectionRetriesLimitReached)
  }
}
