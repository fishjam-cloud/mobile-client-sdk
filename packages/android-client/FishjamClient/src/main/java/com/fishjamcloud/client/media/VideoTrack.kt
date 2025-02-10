package com.fishjamcloud.client.media

import com.fishjamcloud.client.models.Dimensions
import com.fishjamcloud.client.models.Metadata
import com.fishjamcloud.client.ui.VideoTextureViewRenderer
import com.fishjamcloud.client.ui.VideoTextureViewRendererListener
import java.util.UUID

interface VideoTrackListener {
  fun onDimensionsChanged(dimensions: Dimensions)
}

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
  ),
  VideoTextureViewRendererListener {
  private var dimensionsListener: VideoTrackListener? = null

  var dimensions: Dimensions? = null
    private set

  fun addRenderer(renderer: VideoTextureViewRenderer) {
    videoTrack.addSink(renderer)
    renderer.setDimensionsListener(this)
  }

  fun removeRenderer(renderer: VideoTextureViewRenderer) {
    videoTrack.removeSink(renderer)
    renderer.setDimensionsListener(this)
  }

  fun shouldReceive(shouldReceive: Boolean) {
    if (!videoTrack.isDisposed) {
      videoTrack.setShouldReceive(shouldReceive)
    }
  }

  fun setDimensionsListener(listener: VideoTrackListener?) {
    dimensionsListener = listener
  }

  override fun onDimensionsChanged(dimensions: Dimensions) {
    this.dimensions = dimensions
    dimensionsListener?.onDimensionsChanged(dimensions)
  }
}
