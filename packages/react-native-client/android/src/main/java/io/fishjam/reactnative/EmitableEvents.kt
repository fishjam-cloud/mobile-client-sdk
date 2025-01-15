package io.fishjam.reactnative

import com.fishjamcloud.client.ReconnectionStatus
import com.fishjamcloud.client.models.SimulcastConfig
import com.twilio.audioswitch.AudioDevice
import io.fishjam.reactnative.extensions.LocalCamera

enum class PeerStatus(
  val status: String
) {
  Connecting("connecting"),
  Connected("connected"),
  Idle("idle"),
  Error("error")
}

class EmitableEvent private constructor(
  private val event: EventName,
  private val eventContent: Any? = null
) {
  enum class EventName {
    IsMicrophoneOn,
    IsScreenShareOn,
    SimulcastConfigUpdate,
    PeersUpdate,
    AudioDeviceUpdate,
    BandwidthEstimation,
    Warning,
    PeerStatusChanged,
    ReconnectionStatusChanged,
    CurrentCameraChanged
  }

  val name: String
    get() = event.name

  val data: Map<String, Any?>
    get() = mapOf(event.name to eventContent)

  companion object {
    fun isMicrophoneOn(enabled: Boolean) = EmitableEvent(EventName.IsMicrophoneOn, enabled)

    fun isScreenShareOn(enabled: Boolean) = EmitableEvent(EventName.IsScreenShareOn, enabled)

    fun bandwidthEstimation(estimation: Long) = EmitableEvent(EventName.BandwidthEstimation, estimation.toFloat())

    fun warning(message: String) = EmitableEvent(EventName.Warning, message)

    fun peerStatusChanged(peerStatus: PeerStatus) = EmitableEvent(EventName.PeerStatusChanged, peerStatus.status)

    fun reconnectionStatusChanged(reconnectionStatus: ReconnectionStatus) =
      EmitableEvent(EventName.ReconnectionStatusChanged, reconnectionStatus.status)

    fun currentCameraChanged(
      localCamera: LocalCamera?,
      isCameraOn: Boolean,
      isCameraInitialized: Boolean
    ) = EmitableEvent(
      EventName.CurrentCameraChanged,
      mapOf(
        "currentCamera" to localCamera,
        "isCameraOn" to isCameraOn,
        "isCameraInitialized" to isCameraInitialized
      )
    )

    fun simulcastConfigUpdate(simulcastConfig: SimulcastConfig) =
      EmitableEvent(
        EventName.SimulcastConfigUpdate,
        mapOf(
          "enabled" to simulcastConfig.enabled,
          "activeEncodings" to simulcastConfig.activeEncodings.map { it.rid }
        )
      )

    fun peersUpdate(peersData: List<Map<String, Any?>>) = EmitableEvent(EventName.PeersUpdate, peersData)

    fun audioDeviceUpdate(
      audioDevices: List<AudioDevice>,
      selectedDevice: AudioDevice?
    ): EmitableEvent {
      val audioDeviceAsMap = { audioDevice: AudioDevice ->
        mapOf(
          "name" to audioDevice.name,
          "type" to AudioDeviceKind.fromAudioDevice(audioDevice)?.typeName
        )
      }

      return EmitableEvent(
        EventName.AudioDeviceUpdate,
        mapOf(
          "selectedDevice" to (
            if (selectedDevice != null) {
              audioDeviceAsMap(
                selectedDevice
              )
            } else {
              null
            }
          ),
          "availableDevices" to
            audioDevices.map { audioDevice ->
              audioDeviceAsMap(
                audioDevice
              )
            }
        )
      )
    }

    val allEvents: Array<String>
      get() = EventName.entries.map { it.name }.toTypedArray()
  }
}
