package com.fishjamcloud.client.media

import com.fishjamcloud.client.models.Dimensions
import com.fishjamcloud.client.models.Metadata
import com.fishjamcloud.client.ui.VideoTextureViewRenderer
import com.fishjamcloud.client.ui.VideoTextureViewRendererListener
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
  ), VideoTextureViewRendererListener {

  var dimensions: Dimensions? = null
    private set

  fun addRenderer(renderer: VideoSink) {
    videoTrack.addSink(renderer)
    if (renderer is VideoTextureViewRenderer) {
      renderer.setDimensionsListener(this)
    }
  }

  fun removeRenderer(renderer: VideoSink) {
    videoTrack.removeSink(renderer)
    if (renderer is VideoTextureViewRenderer) {
      renderer.setDimensionsListener(null)
    }
  }

  fun shouldReceive(shouldReceive: Boolean) {
    if (!videoTrack.isDisposed) {
      videoTrack.setShouldReceive(shouldReceive)
    }
  }

  override fun onDimensionsChanged(dimensions: Dimensions) {
    this.dimensions = dimensions
  }
}
