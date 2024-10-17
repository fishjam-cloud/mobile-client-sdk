package com.fishjamcloud.client.media

import android.content.Context
import com.fishjamcloud.client.media.LocalVideoTrack.CaptureDevice
import com.fishjamcloud.client.models.Metadata
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

interface CameraNameChangedListener {
  fun onCameraNameChanged(newName: String?)
}

class LocalVideoTrack(
  mediaTrack: org.webrtc.VideoTrack,
  endpointId: String,
  metadata: Metadata,
  val capturer: CameraCapturer,
  val videoParameters: VideoParameters
) : VideoTrack(mediaTrack, endpointId, null, metadata),
  LocalTrack {
  val videoSource: VideoSource
    get() = capturer.source

  constructor(mediaTrack: org.webrtc.VideoTrack, oldTrack: LocalVideoTrack) : this(
    mediaTrack,
    oldTrack.endpointId,
    oldTrack.metadata,
    oldTrack.capturer,
    oldTrack.videoParameters
  )

  data class CaptureDevice(
    val deviceName: String,
    val isFrontFacing: Boolean,
    val isBackFacing: Boolean
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

  fun getCaptureDevice(): CaptureDevice? {
    return capturer.getCaptureDevice()
  }
}

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

  var camerNameChangedListener: CameraNameChangedListener? = null

  private var cameraName: String? = cameraName
    set(value) {
      field = value
      camerNameChangedListener?.onCameraNameChanged(field)
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
