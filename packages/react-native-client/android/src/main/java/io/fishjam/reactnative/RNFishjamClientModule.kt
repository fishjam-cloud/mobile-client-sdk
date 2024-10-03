package io.fishjam.reactnative

import android.content.Intent
import android.os.Build
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import io.fishjam.reactnative.utils.PermissionUtils
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext

class SimulcastConfig : Record {
  @Field
  val enabled: Boolean = false

  @Field
  val activeEncodings: List<String> = emptyList()
}

class CameraConfig : Record {
  @Field
  val quality: String = "VGA169"

  @Field
  val flipDimensions: Boolean = false

  @Field
  val videoTrackMetadata: Map<String, Any> = emptyMap()

  @Field
  val simulcastConfig: SimulcastConfig = SimulcastConfig()

  // expo-modules on Android don't support Either type
  @Field
  val maxBandwidthMap: Map<String, Int> = emptyMap()

  @Field
  val maxBandwidthInt: Int = 0

  @Field
  val cameraEnabled: Boolean = true

  @Field
  val cameraId: String? = null
}

class ScreenShareOptions : Record {
  @Field
  val quality: String = "HD15"

  @Field
  val screenShareMetadata: Map<String, Any> = emptyMap()

  @Field
  val simulcastConfig: SimulcastConfig = SimulcastConfig()

  @Field
  val maxBandwidthMap: Map<String, Int> = emptyMap()

  @Field
  val maxBandwidthInt: Int = 0
}

class ReconnectConfig : Record {
  @Field
  val maxAttempts: Int = 5

  @Field
  val initialDelayMs: Long = 1000

  @Field
  val delayMs: Long = 1000
}

class ConnectConfig : Record {
  @Field
  val reconnectConfig: ReconnectConfig = ReconnectConfig()
}

class ForegroundServiceConfig : Record {
  @Field
  val channelId: String? = null

  @Field
  val channelName: String? = null

  @Field
  val notificationContent: String? = null

  @Field
  val notificationTitle: String? = null

  @Field
  val enableCamera: Boolean = false

  @Field
  val enableMicrophone: Boolean = false

  @Field
  val enableScreencast: Boolean = false

//  @Field
//  val foregroundServiceTypes: IntArray = intArrayOf()
}

class RNFishjamClientModule : Module() {
  override fun definition() = ModuleDefinition {
    val mutex = Mutex()

    val rnFishjamClient = RNFishjamClient { name: String, data: Map<String, Any?> ->
      sendEvent(name, data)
    }

    Name("RNFishjamClient")

    Events(EmitableEvents.allEvents)

    OnCreate {
      rnFishjamClient.onModuleCreate(appContext)
    }

    OnDestroy {
      rnFishjamClient.onModuleDestroy()
    }

    OnActivityDestroys {
      rnFishjamClient.leaveRoom()
    }

    OnActivityResult { _, result ->
      rnFishjamClient.onActivityResult(result.requestCode, result.resultCode, result.data)
    }

    Property("isCameraOn") {
      return@Property rnFishjamClient.isCameraOn
    }

    Property("isMicrophoneOn") {
      return@Property rnFishjamClient.isMicrophoneOn
    }

    Property("cameras") {
      return@Property rnFishjamClient.getCaptureDevices()
    }

    Property("isScreenShareOn") {
      return@Property rnFishjamClient.isScreenShareOn
    }

    Property("peerStatus") {
      return@Property rnFishjamClient.peerStatus
    }

    AsyncFunction(
      "joinRoom"
    ) { url: String, peerToken: String, peerMetadata: Map<String, Any>, config: ConnectConfig, promise: Promise ->
      CoroutineScope(Dispatchers.Main).launch {
        rnFishjamClient.joinRoom(url, peerToken, peerMetadata, config, promise)
      }
    }

    AsyncFunction("leaveRoom") Coroutine { ->
      withContext(Dispatchers.Main) {
        rnFishjamClient.leaveRoom()
      }
    }

    AsyncFunction("startCamera") Coroutine { config: CameraConfig ->
      withContext(Dispatchers.Main) {
        rnFishjamClient.startCamera(config)
      }
    }

    AsyncFunction("toggleMicrophone") Coroutine { ->
      withContext(Dispatchers.Main) {
        rnFishjamClient.toggleMicrophone()
      }
    }

    AsyncFunction("toggleCamera") Coroutine { ->
      withContext(Dispatchers.Main) {
        rnFishjamClient.toggleCamera()
      }
    }

    AsyncFunction("flipCamera") Coroutine { ->
      mutex.withLock {
        withContext(Dispatchers.Main) {
          rnFishjamClient.flipCamera()
        }
      }
    }

    AsyncFunction("switchCamera") Coroutine { cameraId: String ->
      mutex.withLock {
        withContext(Dispatchers.Main) {
          rnFishjamClient.switchCamera(cameraId)
        }
      }
    }

    AsyncFunction("handleScreenSharePermission") { promise: Promise ->
      CoroutineScope(Dispatchers.Main).launch {
        rnFishjamClient.handleScreenSharePermission()
      }
    }

    AsyncFunction("toggleScreenShare") { screenShareOptions: ScreenShareOptions, promise: Promise ->
        rnFishjamClient.toggleScreenShare(screenShareOptions, promise)
    }

    AsyncFunction("getPeers") Coroutine { ->
      withContext(Dispatchers.Main) {
        rnFishjamClient.getPeers()
      }
    }

    AsyncFunction("updatePeerMetadata") Coroutine { metadata: Map<String, Any> ->
      withContext(Dispatchers.Main) {
        rnFishjamClient.updatePeerMetadata(metadata)
      }
    }

    AsyncFunction("updateVideoTrackMetadata") Coroutine { metadata: Map<String, Any> ->
      withContext(Dispatchers.Main) {
        rnFishjamClient.updateLocalVideoTrackMetadata(metadata)
      }
    }

    AsyncFunction("updateAudioTrackMetadata") Coroutine { metadata: Map<String, Any> ->
      withContext(Dispatchers.Main) {
        rnFishjamClient.updateLocalAudioTrackMetadata(metadata)
      }
    }

    AsyncFunction("updateScreenShareTrackMetadata") Coroutine { metadata: Map<String, Any> ->
      withContext(Dispatchers.Main) {
        rnFishjamClient.updateLocalScreenShareTrackMetadata(metadata)
      }
    }

    AsyncFunction("setOutputAudioDevice") { audioDevice: String ->
      rnFishjamClient.setOutputAudioDevice(audioDevice)
    }

    AsyncFunction("startAudioSwitcher") {
      rnFishjamClient.startAudioSwitcher()
    }

    AsyncFunction("stopAudioSwitcher") {
      rnFishjamClient.stopAudioSwitcher()
    }

    AsyncFunction("toggleScreenShareTrackEncoding") Coroutine { encoding: String ->
      withContext(Dispatchers.Main) {
        rnFishjamClient.toggleScreenShareTrackEncoding(encoding)
      }
    }

    AsyncFunction("setScreenShareTrackBandwidth") Coroutine { bandwidth: Int ->
      withContext(Dispatchers.Main) {
        rnFishjamClient.setScreenShareTrackBandwidth(bandwidth)
      }
    }

    AsyncFunction("setScreenShareTrackEncodingBandwidth") Coroutine { encoding: String, bandwidth: Int ->
      withContext(Dispatchers.Main) {
        rnFishjamClient.setScreenShareTrackEncodingBandwidth(encoding, bandwidth)
      }
    }

    AsyncFunction("setTargetTrackEncoding") Coroutine { trackId: String, encoding: String ->
      withContext(Dispatchers.Main) {
        rnFishjamClient.setTargetTrackEncoding(trackId, encoding)
      }
    }

    AsyncFunction("toggleVideoTrackEncoding") Coroutine { encoding: String ->
      withContext(Dispatchers.Main) {
        rnFishjamClient.toggleVideoTrackEncoding(encoding)
      }
    }

    AsyncFunction("setVideoTrackEncodingBandwidth") Coroutine { encoding: String, bandwidth: Int ->
      withContext(Dispatchers.Main) {
        rnFishjamClient.setVideoTrackEncodingBandwidth(encoding, bandwidth)
      }
    }

    AsyncFunction("setVideoTrackBandwidth") Coroutine { bandwidth: Int ->
      withContext(Dispatchers.Main) {
        rnFishjamClient.setVideoTrackBandwidth(bandwidth)
      }
    }

    AsyncFunction("changeWebRTCLoggingSeverity") Coroutine { severity: String ->
      CoroutineScope(Dispatchers.Main).launch {
        rnFishjamClient.changeWebRTCLoggingSeverity(severity)
      }
    }

    AsyncFunction("getStatistics") { rnFishjamClient.getStatistics() }

    Function("setForegroundServiceConfig") { config: ForegroundServiceConfig ->
      rnFishjamClient.setForegroundServiceConfig(config)
    }

    Function("startForegroundService")  {
      rnFishjamClient.startForegroundService()
    }

    Function("stopForegroundService") { ->
      rnFishjamClient.stopForegroundService()
    }
  }
}

