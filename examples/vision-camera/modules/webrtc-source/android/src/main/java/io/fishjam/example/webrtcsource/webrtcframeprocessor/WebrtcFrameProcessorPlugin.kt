package io.fishjam.example.webrtcsource.webrtcframeprocessor

import androidx.camera.core.ImageProxy
import com.fishjamcloud.client.models.CustomSource
import com.fishjamcloud.client.models.CustomSourceConsumer
import com.fishjamcloud.client.models.Metadata
import com.fishjamcloud.client.models.VideoParameters
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy
import io.fishjam.reactnative.RNFishjamClient
import kotlinx.coroutines.runBlocking

class WebrtcFrameProcessorPlugin(proxy: VisionCameraProxy, options: Map<String, Any>?): FrameProcessorPlugin(), CustomSource {
  override val isScreenShare = false
  override val metadata: Metadata = mapOf("type" to "camera")
  override val videoParameters = VideoParameters.presetFHD43

  private var consumer: CustomSourceConsumer? = null

  override fun initialize(consumer: CustomSourceConsumer) {
    this.consumer = consumer
  }

  init {
    runBlocking {
      RNFishjamClient.createCustomSource(this@WebrtcFrameProcessorPlugin)
    }
  }

  override fun callback(frame: Frame, arguments: Map<String, Any>?): Any? {

    consumer?.onImageProxyCaptured(frame.imageProxy)

    return null
  }
}
