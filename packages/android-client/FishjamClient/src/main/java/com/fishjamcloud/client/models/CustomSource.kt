package com.fishjamcloud.client.models

import androidx.camera.core.ImageProxy
import org.webrtc.JavaI420Buffer
import org.webrtc.VideoFrame
import org.webrtc.VideoSource

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

  // TODO: This needs validation if the passes imageProxy is YUV
  override fun onImageProxyCaptured(imageProxy: ImageProxy) {
    val dataY = imageProxy.planes[0].buffer
    val dataU = imageProxy.planes[1].buffer
    val dataV = imageProxy.planes[2].buffer

    val strideY = imageProxy.planes[0].rowStride
    val strideU = imageProxy.planes[1].rowStride
    val strideV = imageProxy.planes[2].rowStride

    val width = imageProxy.width
    val height = imageProxy.height
    val timestamp = System.nanoTime()

    val i420Buffer = JavaI420Buffer.wrap(width, height, dataY, strideY, dataU, strideU, dataV, strideV) {}

    val videoFrame =
      VideoFrame(
        i420Buffer,
        imageProxy.imageInfo.rotationDegrees,
        timestamp
      )

    capturerObserver?.onFrameCaptured(videoFrame)

    videoFrame.release()
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
