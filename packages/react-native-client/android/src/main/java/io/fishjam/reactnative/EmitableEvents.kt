package io.fishjam.reactnative

@Suppress("ktlint:standard:enum-entry-name-case")
enum class PeerStatus {
  connecting,
  connected,
  error,
  idle
}

enum class EmitableEvents {
  IsCameraOn,
  IsMicrophoneOn,
  IsScreenShareOn,
  SimulcastConfigUpdate,
  PeersUpdate,
  AudioDeviceUpdate,
  BandwidthEstimation,
  ReconnectionRetriesLimitReached,
  ReconnectionStarted,
  Reconnected,
  Warning,
  PeerStatusChanged,
  CurrentCameraChanged;

  companion object {
    val allEvents = EmitableEvents.entries.map { it.name }.toTypedArray()
  }
}
