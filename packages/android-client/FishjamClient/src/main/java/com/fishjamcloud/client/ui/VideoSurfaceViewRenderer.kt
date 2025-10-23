package com.fishjamcloud.client.ui

import android.content.Context
import android.util.AttributeSet
import android.util.Log
import com.fishjamcloud.client.models.Dimensions
import org.webrtc.EglBase
import org.webrtc.RendererCommon
import org.webrtc.SurfaceViewRenderer
import java.util.concurrent.CopyOnWriteArrayList

interface VideoSurfaceViewRendererListener {
  fun onDimensionsChanged(dimensions: Dimensions)
}

open class VideoSurfaceViewRenderer : SurfaceViewRenderer {
  private val dimensionsListeners = CopyOnWriteArrayList<VideoSurfaceViewRendererListener>()
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

        val dimensions = Dimensions(rotatedWidth, rotatedHeight)
        for (listener in dimensionsListeners) {
          Log.e("WTF", "EHH")
          listener.onDimensionsChanged(dimensions)
        }
      }
    }

    super.init(sharedContext, combinedEvents)
  }

  fun addDimensionsListener(listener: VideoSurfaceViewRendererListener) {
    dimensionsListeners.add(listener)
  }

  fun removeDimensionsListener(listener: VideoSurfaceViewRendererListener) {
    dimensionsListeners.remove(listener)
  }
}

