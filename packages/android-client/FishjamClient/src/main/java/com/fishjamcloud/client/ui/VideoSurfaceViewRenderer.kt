package com.fishjamcloud.client.ui

import android.content.Context
import android.util.AttributeSet
import com.fishjamcloud.client.models.Dimensions
import org.webrtc.EglBase
import org.webrtc.RendererCommon
import org.webrtc.SurfaceViewRenderer

interface VideoSurfaceViewRendererListener {
  fun onDimensionsChanged(dimensions: Dimensions)
}

open class VideoSurfaceViewRenderer : SurfaceViewRenderer {
  private var dimensionsListener: VideoSurfaceViewRendererListener? = null
  var rotatedFrameWidth = 0
  var rotatedFrameHeight = 0

  internal constructor(context: Context) : super(context)

  internal constructor(context: Context, attrs: AttributeSet) : super(context, attrs)

  override fun init(
    sharedContext: EglBase.Context?,
    rendererEvents: RendererCommon.RendererEvents?
  ) {
    val combinedEvents = object : RendererCommon.RendererEvents {
      override fun onFirstFrameRendered() {
        rendererEvents?.onFirstFrameRendered()
      }

      override fun onFrameResolutionChanged(videoWidth: Int, videoHeight: Int, rotation: Int) {
        rendererEvents?.onFrameResolutionChanged(videoWidth, videoHeight, rotation)

        val rotatedWidth = if (rotation == 0 || rotation == 180) videoWidth else videoHeight
        val rotatedHeight = if (rotation == 0 || rotation == 180) videoHeight else videoWidth

        rotatedFrameWidth = rotatedWidth
        rotatedFrameHeight = rotatedHeight

        dimensionsListener?.onDimensionsChanged(Dimensions(rotatedWidth, rotatedHeight))
      }
    }

    super.init(sharedContext, combinedEvents)
  }

  fun setDimensionsListener(listener: VideoSurfaceViewRendererListener?) {
    dimensionsListener = listener
  }
}

