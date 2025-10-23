package com.fishjamcloud.client.media

import com.fishjamcloud.client.models.Dimensions
import com.fishjamcloud.client.models.Metadata
import com.fishjamcloud.client.ui.VideoSurfaceViewRenderer
import com.fishjamcloud.client.ui.VideoSurfaceViewRendererListener
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
  VideoSurfaceViewRendererListener {
  private var dimensionsListener: VideoTrackListener? = null

  var dimensions: Dimensions? = null
    private set

  fun addRenderer(renderer: VideoSurfaceViewRenderer) {
    videoTrack.addSink(renderer)
    renderer.addDimensionsListener(this)
  }

  fun removeRenderer(renderer: VideoSurfaceViewRenderer) {
    videoTrack.removeSink(renderer)
    renderer.removeDimensionsListener(this)
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
