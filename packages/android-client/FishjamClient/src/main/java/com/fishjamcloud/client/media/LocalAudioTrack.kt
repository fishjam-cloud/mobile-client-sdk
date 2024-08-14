package com.fishjamcloud.client.media

import com.fishjamcloud.client.models.Metadata
import org.webrtc.AudioSource
import org.webrtc.AudioTrack

class LocalAudioTrack(
  mediaTrack: AudioTrack,
  endpointId: String,
  metadata: Metadata,
  internal val audioSource: AudioSource
) : Track(mediaTrack, endpointId, null, metadata),
  LocalTrack {
  constructor(
    mediaTrack: AudioTrack,
    oldTrack: LocalAudioTrack
  ) : this(mediaTrack, oldTrack.endpointId, oldTrack.metadata, oldTrack.audioSource)

  override fun start() {
  }

  override fun stop() {
  }
}
