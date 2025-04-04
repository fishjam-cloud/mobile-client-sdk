package io.fishjam.example.webrtcsource.webrtcframeprocessor

import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy
import io.fishjam.example.webrtcsource.WebrtcVisionCameraCustomSource

class WebrtcFrameProcessorPlugin(proxy: VisionCameraProxy, options: Map<String, Any>?): FrameProcessorPlugin() {
  companion object {
    var currentSource: WebrtcVisionCameraCustomSource? = null
  }

  override fun callback(frame: Frame, arguments: Map<String, Any>?): Frame {
    currentSource?.consumer?.onImageProxyCaptured(frame.imageProxy)
    return frame
  }
}
