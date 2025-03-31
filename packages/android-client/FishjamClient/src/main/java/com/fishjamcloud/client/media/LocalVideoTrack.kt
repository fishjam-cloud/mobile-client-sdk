package com.fishjamcloud.client.media

import android.content.Context
import com.fishjamcloud.client.models.Metadata
import com.fishjamcloud.client.models.VideoParameters
import com.fishjamcloud.client.utils.getEnumerator
import org.webrtc.VideoSource

class LocalVideoTrack(
  mediaTrack: org.webrtc.VideoTrack,
  endpointId: String,
  metadata: Metadata,
  private val capturer: CameraCapturer, // TODO: This need to be refactor and changed to VideoCapturer
  val videoParameters: VideoParameters
) : VideoTrack(mediaTrack, endpointId, null, metadata),
  LocalTrack {
  val videoSource: VideoSource
    get() = capturer.source

  var captureDeviceChangedListener: CaptureDeviceChangedListener?
    get() = capturer.captureDeviceChangedListener
    set(value) {
      capturer.captureDeviceChangedListener = value
    }

  constructor(mediaTrack: org.webrtc.VideoTrack, oldTrack: LocalVideoTrack) : this(
    mediaTrack,
    oldTrack.endpointId,
    oldTrack.metadata,
    oldTrack.capturer,
    oldTrack.videoParameters
  )

  companion object {
    fun getCaptureDevices(context: Context): List<CaptureDevice> {
      val enumerator = getEnumerator(context)
      return enumerator.deviceNames.map { name ->
        CaptureDevice(
          name,
          enumerator.isFrontFacing(name),
          enumerator.isBackFacing(name)
        )
      }
    }
  }

  override fun start() {
    capturer.startCapture()
  }

  override fun stop() {
    capturer.stopCapture()
  }

  suspend fun flipCamera() {
    capturer.flipCamera()
  }

  suspend fun switchCamera(deviceName: String) {
    capturer.switchCamera(deviceName)
  }

  fun isFrontCamera(): Boolean = capturer.isFrontFacingCamera ?: false

  fun getCaptureDevice(): CaptureDevice? = capturer.getCaptureDevice()
}
