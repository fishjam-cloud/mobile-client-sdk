package com.fishjamcloud.client.media

import com.fishjamcloud.client.models.Metadata
import org.webrtc.VideoSink
import java.util.UUID

open class VideoTrack(
  internal val videoTrack: org.webrtc.VideoTrack,
  endpointId: String,
  rtcEngineId: String?,
  metadata: Metadata,
  id: String = UUID.randomUUID().toString()
) : Track(
    videoTrack,
    emptyList(),
    endpointId,
    rtcEngineId,
    metadata,
    id
  ) {
  fun addRenderer(renderer: VideoSink) {
    videoTrack.addSink(renderer)
  }

  fun removeRenderer(renderer: VideoSink) {
    videoTrack.removeSink(renderer)
  }

  fun shouldReceive(shouldReceive: Boolean) {
    if (!videoTrack.isDisposed) {
      videoTrack.setShouldReceive(shouldReceive)
    }
  }
}
