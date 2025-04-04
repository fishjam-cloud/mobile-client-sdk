package io.fishjam.example.webrtcsource

import com.fishjamcloud.client.models.CustomSource
import com.fishjamcloud.client.models.CustomSourceConsumer
import com.fishjamcloud.client.models.VideoParameters
import com.fishjamcloud.client.models.Metadata

class WebrtcVisionCameraCustomSource: CustomSource {
  override val isScreenShare = false
  override val metadata: Metadata = mapOf("type" to "camera")
  override val videoParameters = VideoParameters.presetFHD43

  var consumer: CustomSourceConsumer? = null
    private set

  override fun initialize(consumer: CustomSourceConsumer) {
    this.consumer = consumer
  }
}
