package com.fishjamcloud.client.models

import androidx.camera.core.ImageProxy
import org.webrtc.JavaI420Buffer
import org.webrtc.VideoFrame
import org.webrtc.VideoSource
import org.webrtc.YuvHelper

interface CustomSourceConsumer {
  fun onImageProxyCaptured(imageProxy: ImageProxy)
}

interface CustomSource {
  val isScreenShare: Boolean
  val metadata: Metadata
  val videoParameters: VideoParameters

  fun initialize(consumer: CustomSourceConsumer)
}

class CustomSourceVideoCapturerAdapter(
  val trackId: String,
  val rtcVideoSource: VideoSource,
  val customSource: CustomSource
) : CustomSourceConsumer {
  private val capturerObserver = rtcVideoSource.capturerObserver

  init {
    customSource.initialize(this)
  }

  override fun onImageProxyCaptured(imageProxy: ImageProxy) {
    // Get the image buffer
    val buffer = imageProxy.planes[0].buffer

    // Create WebRTC I420 buffer
    val width = imageProxy.width
    val height = imageProxy.height
    val timestamp = System.nanoTime()

    val i420Buffer = JavaI420Buffer.allocate(width, height)

    // Convert YUV format to I420
    YuvHelper.copyPlane(
      buffer,
      imageProxy.planes[0].rowStride,
      i420Buffer.dataY,
      i420Buffer.strideY,
      width,
      height
    )

    // Create VideoFrame
    val videoFrame =
      VideoFrame(
        i420Buffer,
        imageProxy.imageInfo.rotationDegrees,
        timestamp
      )

    capturerObserver?.onFrameCaptured(videoFrame)
  }
}

class CustomSourceManager {
  private val sources: MutableList<CustomSourceVideoCapturerAdapter> = mutableListOf()

  fun add(
    source: CustomSource,
    trackId: String,
    rtcVideoSource: VideoSource
  ) {
    sources.add(
      CustomSourceVideoCapturerAdapter(
        trackId = trackId,
        rtcVideoSource = rtcVideoSource,
        customSource = source
      )
    )
  }

  fun remove(source: CustomSource): String? {
    val index = sources.indexOfFirst { it.customSource == source }
    if (index != -1) {
      val trackId = sources[index].trackId
      sources.removeAt(index)
      return trackId
    }
    return null
  }
}
