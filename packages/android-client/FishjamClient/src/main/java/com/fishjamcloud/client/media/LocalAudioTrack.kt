package com.fishjamcloud.client.media

import com.fishjamcloud.client.models.Metadata
import org.webrtc.AudioTrack

class LocalAudioTrack(
  mediaTrack: AudioTrack,
  endpointId: String,
  metadata: Metadata
) : Track(mediaTrack, endpointId, mediaTrack.id(), metadata),
  LocalTrack {
  override fun start() {
  }

  override fun stop() {
  }
}
