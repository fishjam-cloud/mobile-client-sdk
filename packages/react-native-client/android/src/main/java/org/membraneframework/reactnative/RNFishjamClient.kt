package org.membraneframework.reactnative

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.media.projection.MediaProjectionManager
import androidx.appcompat.app.AppCompatActivity
import com.fishjamdev.client.Config
import com.fishjamdev.client.FishjamClient
import com.fishjamdev.client.FishjamClientListener
import com.fishjamdev.client.media.LocalAudioTrack
import com.fishjamdev.client.media.LocalScreencastTrack
import com.fishjamdev.client.media.LocalVideoTrack
import com.fishjamdev.client.media.RemoteAudioTrack
import com.fishjamdev.client.media.RemoteVideoTrack
import com.fishjamdev.client.media.Track
import com.fishjamdev.client.models.Endpoint
import com.fishjamdev.client.models.Metadata
import com.fishjamdev.client.models.Peer
import com.fishjamdev.client.models.RTCInboundStats
import com.fishjamdev.client.models.RTCOutboundStats
import com.fishjamdev.client.models.SimulcastConfig
import com.fishjamdev.client.models.TrackBandwidthLimit
import com.fishjamdev.client.models.VideoParameters
import com.twilio.audioswitch.AudioDevice
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import org.webrtc.Logging

class RNFishjamClient(
  val sendEvent: (name: String, data: Map<String, Any?>) -> Unit
) : FishjamClientListener {
  private val SCREENCAST_REQUEST = 1

  var isMicrophoneOn = false
  var isCameraOn = false
  var isScreencastOn = false

  private var connectPromise: Promise? = null
  private var screencastPromise: Promise? = null

  var videoSimulcastConfig: SimulcastConfig = SimulcastConfig()
  private var localUserMetadata: Metadata = mutableMapOf()

  var screencastQuality: String? = null
  var screencastSimulcastConfig: SimulcastConfig = SimulcastConfig()
  var screencastMaxBandwidth: TrackBandwidthLimit = TrackBandwidthLimit.BandwidthLimit(0)

  var screencastMetadata: Map<String, Any> = mutableMapOf()

  var audioSwitchManager: AudioSwitchManager? = null

  var appContext: AppContext? = null

  interface OnTrackUpdateListener {
    fun onTracksUpdate()
  }

  companion object {
    var onTracksUpdateListeners: MutableList<OnTrackUpdateListener> = mutableListOf()
    var fishjamClient: FishjamClient? = null
  }

  fun onModuleCreate(appContext: AppContext) {
    this.appContext = appContext
    this.audioSwitchManager = AudioSwitchManager(appContext.reactContext!!)
    create()
  }

  fun onModuleDestroy() {
    audioSwitchManager?.stop()
  }

  fun onActivityResult(
    requestCode: Int, resultCode: Int, data: Intent?
  ) = runBlocking {
    launch(Dispatchers.Main) {
        if (requestCode != SCREENCAST_REQUEST) return@launch
        if (resultCode != Activity.RESULT_OK) {
          screencastPromise?.resolve(false)
          screencastPromise = null
          return@launch
        }

        data?.let {
          startScreencast(it)
        }
    }
  }

  private fun getSimulcastConfigFromOptions(simulcastConfigMap: org.membraneframework.reactnative.SimulcastConfig): SimulcastConfig {
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
    fishjamClient = FishjamClient(
      appContext = appContext?.reactContext!!, listener = this
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

  private fun getLocalVideoTrack(): LocalVideoTrack? {
    return fishjamClient?.getLocalEndpoint()?.tracks?.values?.filterIsInstance<LocalVideoTrack>()
      ?.first()
  }

  private fun getLocalAudioTrack(): LocalAudioTrack? {
    return fishjamClient?.getLocalEndpoint()?.tracks?.values?.filterIsInstance<LocalAudioTrack>()
      ?.first()
  }

  private fun getLocalScreencastTrack(): LocalScreencastTrack? {
    return fishjamClient?.getLocalEndpoint()?.tracks?.values?.filterIsInstance<LocalScreencastTrack>()
      ?.first()
  }

  private fun ensureCreated() {
    if (fishjamClient == null) {
      throw CodedException("Client not created yet. Make sure to call create() first!")
    }
  }

  private fun ensureConnected() {
    if (fishjamClient == null) {
      throw CodedException("Client not connected to server yet. Make sure to call connect() first!")
    }
  }

  private fun ensureVideoTrack() {
    if (getLocalVideoTrack() == null) {
      throw CodedException("No local video track. Make sure to call connect() first!")
    }
  }

  private fun ensureAudioTrack() {
    if (getLocalAudioTrack() == null) {
      throw CodedException("No local audio track. Make sure to call connect() first!")
    }
  }

  private fun ensureScreencastTrack() {
    if (getLocalScreencastTrack() == null) {
      throw CodedException("No local screencast track. Make sure to toggle screencast on first!")
    }
  }

  override fun onAuthError() {
    CoroutineScope(Dispatchers.Main).launch {
      connectPromise?.reject(CodedException("Connection error"))
      connectPromise = null
    }
  }

  override fun onAuthSuccess() {
    CoroutineScope(Dispatchers.Main).launch {
      joinRoom()
    }
  }

  fun connect(
    url: String,
    peerToken: String,
    peerMetadata: Map<String, Any>,
    promise: Promise
  ) {
    ensureCreated()
    connectPromise = promise
    localUserMetadata = peerMetadata
    fishjamClient?.connect(Config(url, peerToken))
  }

  private fun joinRoom() {
    fishjamClient?.join(localUserMetadata)
  }

  fun leaveRoom() {
    ensureCreated()
    if (isScreencastOn) {
      stopScreencast()
    }
    isMicrophoneOn = false
    isCameraOn = false
    isScreencastOn = false
    fishjamClient?.leave()
  }

  suspend fun startCamera(config: CameraConfig) {
    val cameraTrack = createCameraTrack(config) ?: return
    setCameraTrackState(cameraTrack, config.cameraEnabled)
  }

  private suspend fun createCameraTrack(config: CameraConfig): LocalVideoTrack? {
    val videoParameters = getVideoParametersFromOptions(config)
    videoSimulcastConfig = getSimulcastConfigFromOptions(config.simulcastConfig)
    return fishjamClient?.createVideoTrack(
      videoParameters,
      config.videoTrackMetadata,
      config.captureDeviceId
    )
  }

  private fun setCameraTrackState(cameraTrack: LocalVideoTrack, isEnabled: Boolean) {
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

  fun flipCamera() {
    ensureVideoTrack()
    getLocalVideoTrack()?.flipCamera()
  }

  fun switchCamera(captureDeviceId: String) {
    ensureVideoTrack()
    getLocalVideoTrack()?.switchCamera(captureDeviceId)
  }

  suspend fun startMicrophone(config: MicrophoneConfig) {
    val microphoneTrack = fishjamClient?.createAudioTrack(config.audioTrackMetadata)
      ?: throw CodedException("Failed to Create Track")
    setMicrophoneTrackState(microphoneTrack, config.microphoneEnabled)
  }

  private fun setMicrophoneTrackState(microphoneTrack: LocalAudioTrack, isEnabled: Boolean) {
    microphoneTrack.setEnabled(isEnabled)
    isMicrophoneOn = isEnabled
    val eventName = EmitableEvents.IsMicrophoneOn
    val isMicrophoneOnMap = mapOf(eventName to isEnabled)
    emitEvent(eventName, isMicrophoneOnMap)
  }

  fun toggleMicrophone(): Boolean {
    ensureAudioTrack()
    getLocalAudioTrack()?.let { setMicrophoneTrackState(it, !isMicrophoneOn) }
    return isMicrophoneOn
  }

  fun toggleScreencast(
    screencastOptions: ScreencastOptions,
    promise: Promise
  ) {
    this.screencastMetadata = screencastOptions.screencastMetadata
    this.screencastQuality = screencastOptions.quality
    this.screencastSimulcastConfig =
      getSimulcastConfigFromOptions(screencastOptions.simulcastConfig)
    this.screencastMaxBandwidth =
      getMaxBandwidthFromOptions(
        screencastOptions.maxBandwidthMap,
        screencastOptions.maxBandwidthInt
      )
    screencastPromise = promise
    if (!isScreencastOn) {
      ensureConnected()
      val currentActivity = appContext?.currentActivity ?: throw ActivityNotFoundException()

      val mediaProjectionManager =
        appContext?.reactContext!!.getSystemService(
          AppCompatActivity.MEDIA_PROJECTION_SERVICE
        ) as MediaProjectionManager
      val intent = mediaProjectionManager.createScreenCaptureIntent()
      currentActivity.startActivityForResult(intent, SCREENCAST_REQUEST)
    } else {
      stopScreencast()
    }
  }

  fun getEndpoints(): List<Map<String, Any?>> {
    val listOfPeers = fishjamClient?.getRemotePeers()?.toMutableList() ?: mutableListOf()
    val localEndpoint = fishjamClient?.getLocalEndpoint()
    if(localEndpoint != null) {
      listOfPeers.add(localEndpoint)
    }
    return listOfPeers.map { endpoint ->
      mapOf("id" to endpoint.id,
        "isLocal" to (endpoint.id == fishjamClient?.getLocalEndpoint()?.id),
        "type" to endpoint.type,
        "metadata" to endpoint.metadata,
        "tracks" to endpoint.tracks.values.mapNotNull { track ->
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
        })
    }
  }

  fun getCaptureDevices(): List<Map<String, Any>> {
    val devices = LocalVideoTrack.getCaptureDevices(appContext?.reactContext!!)
    return devices.map { device ->
      mapOf<String, Any>(
        "id" to device.deviceName,
        "name" to device.deviceName,
        "isFrontFacing" to device.isFrontFacing,
        "isBackFacing" to device.isBackFacing
      )
    }
  }

  fun updateEndpointMetadata(metadata: Metadata) {
    ensureConnected()
    fishjamClient?.updatePeerMetadata(metadata)
  }

  private fun updateTrackMetadata(
    trackId: String,
    metadata: Metadata
  ) {
    fishjamClient?.updateTrackMetadata(trackId, metadata)
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
      fishjamClient?.disableTrackEncoding(trackId, trackEncoding)
    } else {
      fishjamClient?.enableTrackEncoding(trackId, trackEncoding)
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
      fishjamClient?.setTrackBandwidth(it.id(), TrackBandwidthLimit.BandwidthLimit(bandwidth))
    }
  }

  fun setScreencastTrackEncodingBandwidth(
    encoding: String,
    bandwidth: Int
  ) {
    ensureScreencastTrack()
    getLocalScreencastTrack()?.let {
      fishjamClient?.setEncodingBandwidth(
        it.id(), encoding, TrackBandwidthLimit.BandwidthLimit(bandwidth)
      )
    }
  }

  fun setTargetTrackEncoding(
    trackId: String,
    encoding: String
  ) {
    ensureConnected()
    fishjamClient?.setTargetTrackEncoding(trackId, encoding.toTrackEncoding())
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
      fishjamClient?.setEncodingBandwidth(
        it.id(), encoding, TrackBandwidthLimit.BandwidthLimit(bandwidth)
      )
    }
  }

  fun setVideoTrackBandwidth(bandwidth: Int) {
    ensureVideoTrack()
    getLocalVideoTrack()?.let {
      fishjamClient?.setTrackBandwidth(it.id(), TrackBandwidthLimit.BandwidthLimit(bandwidth))
    }
  }

  fun changeWebRTCLoggingSeverity(severity: String) {
    when (severity) {
      "verbose" -> fishjamClient?.changeWebRTCLoggingSeverity(Logging.Severity.LS_VERBOSE)

      "info" -> fishjamClient?.changeWebRTCLoggingSeverity(Logging.Severity.LS_INFO)

      "error" -> fishjamClient?.changeWebRTCLoggingSeverity(Logging.Severity.LS_ERROR)

      "warning" -> fishjamClient?.changeWebRTCLoggingSeverity(Logging.Severity.LS_WARNING)

      "none" -> fishjamClient?.changeWebRTCLoggingSeverity(Logging.Severity.LS_NONE)

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
    ensureCreated()
    val newMap = mutableMapOf<String, Map<String, Any?>>()
    fishjamClient?.getStats()?.forEach { entry ->
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

  private suspend fun startScreencast(mediaProjectionPermission: Intent) {
    val videoParameters = getScreencastVideoParameters()
    fishjamClient?.createScreencastTrack(
      mediaProjectionPermission, videoParameters, screencastMetadata
    ) ?: throw CodedException("Failed to Create ScreenCast Track")
    setScreencastTrackState(true)

    screencastPromise?.resolve(isScreencastOn)
    screencastPromise = null
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
    emitEndpoints()
  }

  private fun stopScreencast() {
    ensureScreencastTrack()
    setScreencastTrackState(false)
    screencastPromise?.resolve(isScreencastOn)
    screencastPromise = null
  }

  private fun emitEvent(
    eventName: String,
    data: Map<String, Any?>
  ) {
    sendEvent(eventName, data)
  }

  private fun emitEndpoints() {
    val eventName = EmitableEvents.EndpointsUpdate
    val map = mapOf(eventName to getEndpoints())
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

  override fun onJoined(peerID: String, peersInRoom: MutableMap<String, Endpoint>) {
    CoroutineScope(Dispatchers.Main).launch {
      connectPromise?.resolve(null)
      connectPromise = null
      emitEndpoints()
    }
  }

  override fun onJoinError(metadata: Any) {
    CoroutineScope(Dispatchers.Main).launch {
      connectPromise?.reject(CodedException("Join error: $metadata"))
      connectPromise = null
    }
  }

  private fun addOrUpdateTrack(ctx: Track) {
    emitEndpoints()
    onTracksUpdateListeners.forEach { it.onTracksUpdate() }
  }

  override fun onTrackReady(ctx: Track) {
    CoroutineScope(Dispatchers.Main).launch {
      addOrUpdateTrack(ctx)
    }
  }

  override fun onTrackAdded(ctx: Track) {}

  override fun onTrackRemoved(ctx: Track) {
    CoroutineScope(Dispatchers.Main).launch {
      emitEndpoints()
    }
  }

  override fun onTrackUpdated(ctx: Track) {
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
}
