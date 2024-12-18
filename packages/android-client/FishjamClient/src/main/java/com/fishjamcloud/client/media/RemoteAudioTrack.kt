package com.fishjamcloud.client.media

import com.fishjamcloud.client.models.Metadata
import fishjam.media_events.server.Server
import org.webrtc.AudioTrack
import java.util.UUID

fun interface OnVoiceActivityChangedListener {
  fun onVoiceActivityChanged(trackContext: RemoteAudioTrack)
}

class RemoteAudioTrack(
  audioTrack: AudioTrack,
  endpointId: String,
  rtcEngineId: String?,
  metadata: Metadata,
  id: String = UUID.randomUUID().toString()
) : Track(audioTrack, emptyList(), endpointId, rtcEngineId, metadata, id) {
  private var onVadNotificationListener: (OnVoiceActivityChangedListener)? = null

  var vadStatus = Server.MediaEvent.VadNotification.Status.STATUS_SILENCE
    internal set(value) {
      field = value
      onVadNotificationListener?.let { onVadNotificationListener?.onVoiceActivityChanged(this) }
    }

  /**
   * Sets listener that is called every time an update about voice activity is received from the server.
   */
  fun setOnVoiceActivityChangedListener(listener: OnVoiceActivityChangedListener?) {
    listener?.onVoiceActivityChanged(this)
    onVadNotificationListener = listener
  }
}

interface OnSoundDetectedListener {
  fun onSoundDetected(isDetected: Boolean)

  fun onSoundVolumeChanged(volume: Int)
}
