package io.fishjam.reactnative

enum class ParticipantStatus {
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
  ParticipantStatusChanged
}
