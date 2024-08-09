package org.membraneframework.reactnative

import expo.modules.kotlin.Promise
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
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
  val flipVideo: Boolean = false

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
  val captureDeviceId: String? = null
}

class MicrophoneConfig : Record {
  @Field
  val audioTrackMetadata: Map<String, Any> = emptyMap()

  @Field
  val microphoneEnabled: Boolean = true
}

class ScreencastOptions : Record {
  @Field
  val quality: String = "HD15"

  @Field
  val screencastMetadata: Map<String, Any> = emptyMap()

  @Field
  val simulcastConfig: SimulcastConfig = SimulcastConfig()

  @Field
  val maxBandwidthMap: Map<String, Int> = emptyMap()

  @Field
  val maxBandwidthInt: Int = 0
}

class RNFishjamClientModule : Module() {
  override fun definition() =
    ModuleDefinition {
      Name("RNFishjamClient")

      Events(
        "IsCameraOn",
        "IsMicrophoneOn",
        "IsScreencastOn",
        "SimulcastConfigUpdate",
        "PeersUpdate",
        "AudioDeviceUpdate",
        "SendMediaEvent",
        "BandwidthEstimation"
      )

      val rnFishjamClient =
        RNFishjamClient { name: String, data: Map<String, Any?> ->
          sendEvent(name, data)
        }

      val mutex = Mutex()

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

      AsyncFunction("connect") { url: String, peerToken: String, peerMetadata: Map<String, Any>, promise: Promise ->
        CoroutineScope(Dispatchers.Main).launch {
          rnFishjamClient.connect(url, peerToken, peerMetadata, promise)
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

      AsyncFunction("startMicrophone") Coroutine { config: MicrophoneConfig ->
        withContext(Dispatchers.Main) {
          rnFishjamClient.startMicrophone(config)
        }
      }

      Property("isMicrophoneOn") {
        return@Property rnFishjamClient.isMicrophoneOn
      }

      AsyncFunction("toggleMicrophone") Coroutine { ->
        withContext(Dispatchers.Main) {
          rnFishjamClient.toggleMicrophone()
        }
      }

      Property("isCameraOn") {
        return@Property rnFishjamClient.isCameraOn
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

      AsyncFunction("switchCamera") Coroutine { captureDeviceId: String ->
        mutex.withLock {
          withContext(Dispatchers.Main) {
            rnFishjamClient.switchCamera(captureDeviceId)
          }
        }
      }

      AsyncFunction("getCaptureDevices") Coroutine { ->
        withContext(Dispatchers.Main) {
          rnFishjamClient.getCaptureDevices()
        }
      }

      AsyncFunction("handleScreencastPermission") { promise: Promise ->
        CoroutineScope(Dispatchers.Main).launch {
          rnFishjamClient.handleScreencastPermission(promise)
        }
      }

      AsyncFunction("toggleScreencast") Coroutine { screencastOptions: ScreencastOptions ->
        withContext(Dispatchers.Main) {
          rnFishjamClient.toggleScreencast(screencastOptions)
        }
      }

      Property("isScreencastOn") {
        return@Property rnFishjamClient.isScreencastOn
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

      AsyncFunction("updateScreencastTrackMetadata") Coroutine { metadata: Map<String, Any> ->
        withContext(Dispatchers.Main) {
          rnFishjamClient.updateLocalScreencastTrackMetadata(metadata)
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

      AsyncFunction("toggleScreencastTrackEncoding") Coroutine { encoding: String ->
        withContext(Dispatchers.Main) {
          rnFishjamClient.toggleScreencastTrackEncoding(encoding)
        }
      }

      AsyncFunction("setScreencastTrackBandwidth") Coroutine { bandwidth: Int ->
        withContext(Dispatchers.Main) {
          rnFishjamClient.setScreencastTrackBandwidth(bandwidth)
        }
      }

      AsyncFunction("setScreencastTrackEncodingBandwidth") Coroutine { encoding: String, bandwidth: Int ->
        withContext(Dispatchers.Main) {
          rnFishjamClient.setScreencastTrackEncodingBandwidth(encoding, bandwidth)
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
    }
}
