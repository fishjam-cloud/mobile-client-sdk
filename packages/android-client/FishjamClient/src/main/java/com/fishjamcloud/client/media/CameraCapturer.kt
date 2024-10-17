package com.fishjamcloud.client.media

import android.content.Context
import com.fishjamcloud.client.models.VideoParameters
import com.fishjamcloud.client.utils.getEnumerator
import kotlinx.coroutines.CompletableJob
import kotlinx.coroutines.Job
import org.webrtc.CameraEnumerationAndroid
import org.webrtc.CameraVideoCapturer
import org.webrtc.EglBase
import org.webrtc.Size
import org.webrtc.SurfaceTextureHelper
import org.webrtc.VideoSource
import timber.log.Timber
import java.util.concurrent.CancellationException

interface CaptureDeviceChangedListener {
  fun onCaptureDeviceChanged(captureDevice: CaptureDevice?)
}

data class CaptureDevice(
  val deviceName: String,
  val isFrontFacing: Boolean,
  val isBackFacing: Boolean
)

class CameraCapturer(
  private val context: Context,
  val source: VideoSource,
  private val rootEglBase: EglBase,
  private val videoParameters: VideoParameters,
  cameraName: String?,
) :
  CameraVideoCapturer.CameraSwitchHandler {
  private lateinit var cameraCapturer: CameraVideoCapturer
  private lateinit var size: Size
  private var isCapturing = false
  private var switchingCameraJob: CompletableJob? = null
  var isFrontFacingCamera = false

  var captureDeviceChangedListener: CaptureDeviceChangedListener? = null

  private var cameraName: String? = cameraName
    set(value) {
      field = value
      captureDeviceChangedListener?.onCaptureDeviceChanged(getCaptureDevice())
    }

  init {
    createCapturer(cameraName)
  }

  fun startCapture() {
    isCapturing = true
    cameraCapturer.startCapture(size.width, size.height, videoParameters.maxFps)
  }

  fun stopCapture() {
    isCapturing = false
    cameraCapturer.stopCapture()
    cameraCapturer.dispose()
  }

  suspend fun flipCamera() {
    val devices = LocalVideoTrack.getCaptureDevices(context)
    val deviceName =
      devices
        .first {
          (isFrontFacingCamera && it.isBackFacing) || (!isFrontFacingCamera && it.isFrontFacing)
        }.deviceName
    switchCamera(deviceName)
  }

  suspend fun switchCamera(deviceName: String) {
    switchingCameraJob = Job()
    cameraCapturer.switchCamera(this, deviceName)
    switchingCameraJob?.join()
    cameraName = deviceName
  }

  fun getCaptureDevice(): CaptureDevice? {
    val enumerator = getEnumerator(context)

    enumerator.deviceNames.forEach { name ->
      if (cameraName == name) {
        return CaptureDevice(
          name,
          enumerator.isFrontFacing(name),
          enumerator.isBackFacing(name)
        )
      }
    }
    return null
  }

  private fun createCapturer(providedDeviceName: String?) {
    val enumerator = getEnumerator(context)

    var deviceName = providedDeviceName

    if (deviceName == null) {
      for (name in enumerator.deviceNames) {
        if (enumerator.isFrontFacing(name)) {
          deviceName = name
          break
        }
      }
    }

    cameraName = deviceName

    isFrontFacingCamera = enumerator.isFrontFacing(deviceName)

    this.cameraCapturer = enumerator.createCapturer(deviceName, null)

    this.cameraCapturer.initialize(
      SurfaceTextureHelper.create("CameraCaptureThread", rootEglBase.eglBaseContext),
      context,
      source.capturerObserver
    )

    val sizes =
      enumerator
        .getSupportedFormats(deviceName)
        ?.map { Size(it.width, it.height) }
        ?: emptyList()

    this.size =
      CameraEnumerationAndroid.getClosestSupportedSize(
        sizes,
        videoParameters.dimensions.width,
        videoParameters.dimensions.height
      )
  }

  override fun onCameraSwitchDone(isFrontCamera: Boolean) {
    isFrontFacingCamera = isFrontCamera
    switchingCameraJob?.complete()
  }

  override fun onCameraSwitchError(errorDescription: String?) {
    Timber.e("Failed to switch camera: $errorDescription")
    switchingCameraJob?.cancel(CancellationException(errorDescription))
  }
}
