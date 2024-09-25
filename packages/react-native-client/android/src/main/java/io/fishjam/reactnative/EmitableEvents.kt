package io.fishjam.reactnative

object ParticipantStatus {
  const val connecting = "connecting"
  const val connected  = "connected"
  const val error = "error"
  const val idle = "idle"
}

object EmitableEvents {
  const val IsCameraOn = "IsCameraOn"
  const val IsMicrophoneOn = "IsMicrophoneOn"
  const val IsScreenShareOn = "IsScreenShareOn"
  const val SimulcastConfigUpdate = "SimulcastConfigUpdate"
  const val PeersUpdate = "PeersUpdate"
  const val AudioDeviceUpdate = "AudioDeviceUpdate"
  const val BandwidthEstimation = "BandwidthEstimation"
  const val ReconnectionRetriesLimitReached = "ReconnectionRetriesLimitReached"
  const val ReconnectionStarted = "ReconnectionStarted"
  const val Reconnected = "Reconnected"
  const val Warning = "Warning"
  const val ParticipantStatusChanged = "ParticipantStatusChanged"
}
