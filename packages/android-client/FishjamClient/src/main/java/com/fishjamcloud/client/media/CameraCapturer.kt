package com.fishjamcloud.client.media

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import android.renderscript.Allocation
import android.renderscript.Element
import android.renderscript.RenderScript
import android.renderscript.ScriptIntrinsicBlur
import com.fishjamcloud.client.models.VideoParameters
import com.fishjamcloud.client.utils.getEnumerator
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.segmentation.Segmentation
import com.google.mlkit.vision.segmentation.Segmenter
import com.google.mlkit.vision.segmentation.selfie.SelfieSegmenterOptions
import kotlinx.coroutines.CompletableJob
import kotlinx.coroutines.Job
import org.webrtc.CameraEnumerationAndroid
import org.webrtc.CameraVideoCapturer
import org.webrtc.EglBase
import org.webrtc.Size
import org.webrtc.SurfaceTextureHelper
import org.webrtc.VideoFrame
import org.webrtc.VideoProcessor
import org.webrtc.VideoSink
import org.webrtc.VideoSource
import timber.log.Timber
import java.nio.ByteBuffer
import java.util.concurrent.CancellationException
import org.webrtc.JavaI420Buffer

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
  cameraName: String?
) : CameraVideoCapturer.CameraSwitchHandler {
  private lateinit var cameraCapturer: CameraVideoCapturer
  private lateinit var size: Size
  private var isCapturing = false
  private var switchingCameraJob: CompletableJob? = null
  var isFrontFacingCamera = false

  // Background blur properties
  private var isBackgroundBlurEnabled = true
  private var backgroundBlurAmount = 25f  // Range: 1-25
  private var segmenter: Segmenter? = null
  private var renderScript: RenderScript? = null
  private var blurScript: ScriptIntrinsicBlur? = null
  private var frameProcessor: BackgroundBlurProcessor? = null

  var captureDeviceChangedListener: CaptureDeviceChangedListener? = null

  // Logger tag for easy filtering
  companion object {
    private const val LOG_TAG = "BackgroundBlur"
  }

  private var cameraName: String? = cameraName
    set(value) {
      field = value
      captureDeviceChangedListener?.onCaptureDeviceChanged(getCaptureDevice())
    }

  init {
    createCapturer(cameraName)
    initializeBackgroundBlur()
  }

  /**
   * Initialize the ML model for person segmentation and blur processing
   */
  private fun initializeBackgroundBlur() {
    // Create selfie segmenter with stream mode for realtime processing
    val options = SelfieSegmenterOptions.Builder()
      .setDetectorMode(SelfieSegmenterOptions.STREAM_MODE)
      .build()
    segmenter = Segmentation.getClient(options)

    // Create RenderScript for applying blur effect
    renderScript = RenderScript.create(context)
    blurScript = ScriptIntrinsicBlur.create(renderScript, Element.U8_4(renderScript))

    // Create frame processor
    frameProcessor = BackgroundBlurProcessor(segmenter!!, renderScript!!, blurScript!!)
  }

  fun startCapture() {
    isCapturing = true
    if (isBackgroundBlurEnabled && frameProcessor != null) {
      source.setVideoProcessor(frameProcessor)
    }
    cameraCapturer.startCapture(size.width, size.height, videoParameters.maxFps)
  }

  fun stopCapture() {
    isCapturing = false
    source.setVideoProcessor(null)
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

  /**
   * Enable or disable background blur
   */
  fun setBackgroundBlurEnabled(enabled: Boolean) {
    Timber.i("$LOG_TAG: Background blur enabled: $enabled")
    this.isBackgroundBlurEnabled = enabled
    if (isCapturing) {
      if (enabled && frameProcessor != null) {
        source.setVideoProcessor(frameProcessor)
      } else {
        source.setVideoProcessor(null)
      }
    }
  }

  /**
   * Set the blur amount (1-25)
   */
  fun setBackgroundBlurAmount(amount: Float) {
    val clampedAmount = amount.coerceIn(1f, 25f)
    Timber.i("$LOG_TAG: Background blur amount: $clampedAmount")
    backgroundBlurAmount = clampedAmount
    frameProcessor?.setBlurAmount(backgroundBlurAmount)
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

  /**
   * Clean up resources when no longer needed
   */
  fun release() {
    segmenter?.close()
    blurScript?.destroy()
    renderScript?.destroy()
  }

  /**
   * Processor that applies background blur to video frames
   */
  private inner class BackgroundBlurProcessor(
    private val segmenter: Segmenter,
    private val renderScript: RenderScript,
    private val blurScript: ScriptIntrinsicBlur
  ) : VideoProcessor {
    private var blurAmount = backgroundBlurAmount
    private var sink: VideoSink? = null
    private var frameCount = 0
    private var lastLogTime = System.currentTimeMillis()
    private var personDetected = false
    private var personCoverage = 0.0f

    fun setBlurAmount(amount: Float) {
      blurAmount = amount
    }

    override fun setSink(sink: VideoSink?) {
      this.sink = sink
    }

    override fun onCapturerStarted(success: Boolean) {
      frameCount = 0
      lastLogTime = System.currentTimeMillis()
      Timber.i("$LOG_TAG: Background blur processing started: $success")
    }

    override fun onCapturerStopped() {
      Timber.i("$LOG_TAG: Background blur processing stopped")
    }

    override fun onFrameCaptured(videoFrame: VideoFrame) {
      frameCount++
      // Only log once per second to avoid spamming
      val now = System.currentTimeMillis()
      val shouldLog = now - lastLogTime > 1000
      
      // Convert WebRTC frame to bitmap
      val buffer = videoFrame.buffer
      val width = buffer.width
      val height = buffer.height

      // Skip processing for large frames to avoid performance issues
      if (width > 1280 || height > 720) {
        if (shouldLog) {
          Timber.i("$LOG_TAG: Frame too large for blur: ${width}x${height}")
          lastLogTime = now
        }
        sink?.onFrame(videoFrame)
        return
      }

      try {
        // Retain the video frame before async processing
        videoFrame.retain()
        
        // Convert to I420 if needed
        val i420Buffer = buffer.toI420() ?: run {
          sink?.onFrame(videoFrame)
          videoFrame.release()
          return
        }

        // Convert I420 buffer to bitmap with actual frame content
        val bitmap = i420ToBitmap(i420Buffer, width, height)

        // Process with ML Kit for segmentation
        val inputImage = InputImage.fromBitmap(bitmap, 0)

        // Run segmentation and apply blur effect
        segmenter.process(inputImage)
          .addOnSuccessListener { segmentationMask ->
            try {
              val maskWidth = segmentationMask.width
              val maskHeight = segmentationMask.height
              val maskBuffer = segmentationMask.buffer
              
              // Apply blur effect using the segmentation mask
              val processedBitmap = applyBackgroundBlur(bitmap, maskBuffer, maskWidth, maskHeight)
              
              // Log detection results periodically
              if (shouldLog) {
                lastLogTime = now
                val totalPixels = width * height
                val percentage = (personCoverage * 100).toInt()
                Timber.i("$LOG_TAG: Person detected: $personDetected, coverage: $percentage%, blur amount: $blurAmount")
              }
              
              // Actually use the processed bitmap instead of the original frame
              if (personDetected && personCoverage > 0.05f) { // Only apply if we have meaningful detection (>5%)
                try {
                  // Convert the processed bitmap back to a VideoFrame
                  val processedBuffer = bitmapToI420Buffer(processedBitmap, width, height)
                  val processedFrame = VideoFrame(processedBuffer, videoFrame.rotation, videoFrame.timestampNs)
                  
                  // Send the processed frame to the sink
                  sink?.onFrame(processedFrame)
                  
                  // DO NOT manually release these objects - WebRTC will handle their lifecycle
                  // processedFrame.release() - REMOVED
                  // processedBuffer.release() - REMOVED
                  
                  if (shouldLog) {
                    Timber.i("$LOG_TAG: Blur applied successfully")
                  }
                } catch (e: Exception) {
                  Timber.e("$LOG_TAG: Failed to convert processed bitmap to video frame: ${e.message}")
                  sink?.onFrame(videoFrame) // Fall back to original frame
                }
              } else {
                // No meaningful person detection, just pass through the original frame
                sink?.onFrame(videoFrame)
              }
              
              // Clean up bitmaps when done with them
              bitmap.recycle()
              if (processedBitmap != bitmap) {
                processedBitmap.recycle()
              }
            } catch (e: Exception) {
              Timber.e("$LOG_TAG: Error processing segmentation mask: ${e.message}")
              sink?.onFrame(videoFrame)
            } finally {
              videoFrame.release()
            }
          }
          .addOnFailureListener { e ->
            Timber.e("$LOG_TAG: Segmentation failed: ${e.message}")
            sink?.onFrame(videoFrame)
            bitmap.recycle()
            videoFrame.release()
          }

        // Release the I420 buffer when we're done with it
        i420Buffer.release()
      } catch (e: Exception) {
        Timber.e("$LOG_TAG: Frame processing error: ${e.message}")
        sink?.onFrame(videoFrame)
        try {
          videoFrame.release()
        } catch (re: Exception) {
          // Already released, ignore
        }
      }
    }

    private fun applyBackgroundBlur(bitmap: Bitmap, maskBuffer: ByteBuffer, maskWidth: Int, maskHeight: Int): Bitmap {
      // Create a copy of the bitmap to hold the result
      val result = bitmap.copy(bitmap.config, true)
      val blurred = bitmap.copy(bitmap.config, true)
      
      // Apply blur to the entire image
      val inAllocation = Allocation.createFromBitmap(renderScript, blurred)
      val outAllocation = Allocation.createTyped(renderScript, inAllocation.type)
      
      blurScript.setRadius(blurAmount)
      blurScript.setInput(inAllocation)
      blurScript.forEach(outAllocation)
      
      outAllocation.copyTo(blurred)
      
      // Blend original and blurred based on mask
      val resultPixels = IntArray(bitmap.width * bitmap.height)
      val blurredPixels = IntArray(bitmap.width * bitmap.height)
      result.getPixels(resultPixels, 0, bitmap.width, 0, 0, bitmap.width, bitmap.height)
      blurred.getPixels(blurredPixels, 0, bitmap.width, 0, 0, bitmap.width, bitmap.height)
      
      // Reset mask buffer position
      maskBuffer.rewind()
      
      var personPixelCount = 0
      val totalPixels = bitmap.width * bitmap.height
      
      // Blend pixels based on mask
      for (y in 0 until bitmap.height) {
        // Calculate mask row position with scaling
        val maskY = ((y.toFloat() / bitmap.height) * maskHeight).toInt().coerceIn(0, maskHeight - 1)
        
        for (x in 0 until bitmap.width) {
          // Calculate mask column position with scaling
          val maskX = ((x.toFloat() / bitmap.width) * maskWidth).toInt().coerceIn(0, maskWidth - 1)
          
          // Get the confidence value from the mask (0-1 float)
          val pos = maskY * maskWidth + maskX
          val confidence = maskBuffer.getFloat(pos * 4) // 4 bytes per float
          
          // Pixel index in the arrays
          val pixelIndex = y * bitmap.width + x
          
          // If confidence > threshold, it's a person - keep original
          // Otherwise, it's background - use blurred pixel
          if (confidence < 0.5f) {
            resultPixels[pixelIndex] = blurredPixels[pixelIndex]
          } else {
            personPixelCount++
          }
        }
      }
      
      // Update detection state
      personCoverage = personPixelCount.toFloat() / totalPixels
      personDetected = personPixelCount > (totalPixels * 0.01) // At least 1% of image has a person
      
      // Set the processed pixels back to the result bitmap
      result.setPixels(resultPixels, 0, bitmap.width, 0, 0, bitmap.width, bitmap.height)
      
      // Clean up RenderScript resources
      inAllocation.destroy()
      outAllocation.destroy()
      blurred.recycle()
      
      return result
    }

    private fun createDebugBitmap(width: Int, height: Int): Bitmap {
      // Create a simple bitmap with a gray background
      // In a real implementation, this would be a proper YUV to RGB conversion
      val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
      bitmap.eraseColor(Color.GRAY)
      return bitmap
    }

    private fun i420ToBitmap(i420Buffer: org.webrtc.VideoFrame.I420Buffer, width: Int, height: Int): Bitmap {
      val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
      
      // Get planes data from I420 buffer
      val yBuffer = i420Buffer.dataY
      val uBuffer = i420Buffer.dataU
      val vBuffer = i420Buffer.dataV
      val yStride = i420Buffer.strideY
      val uStride = i420Buffer.strideU
      val vStride = i420Buffer.strideV
      
      // Create array to hold the ARGB pixel data
      val pixels = IntArray(width * height)
      
      // YUV to RGB conversion
      for (y in 0 until height) {
        for (x in 0 until width) {
          val yIndex = y * yStride + x
          val uvIndex = (y / 2) * (uStride) + (x / 2)
          
          // YUV values
          val yValue = yBuffer.get(yIndex).toInt() and 0xFF
          val uValue = uBuffer.get(uvIndex).toInt() and 0xFF
          val vValue = vBuffer.get(uvIndex).toInt() and 0xFF
          
          // Convert YUV to RGB
          var r = (yValue + 1.370705 * (vValue - 128)).toInt()
          var g = (yValue - 0.698001 * (vValue - 128) - 0.337633 * (uValue - 128)).toInt()
          var b = (yValue + 1.732446 * (uValue - 128)).toInt()
          
          // Clamp RGB values to 0-255 range
          r = r.coerceIn(0, 255)
          g = g.coerceIn(0, 255)
          b = b.coerceIn(0, 255)
          
          // Create ARGB pixel
          pixels[y * width + x] = (0xFF shl 24) or (r shl 16) or (g shl 8) or b
        }
      }
      
      // Set pixels to bitmap
      bitmap.setPixels(pixels, 0, width, 0, 0, width, height)
      return bitmap
    }

    /**
     * Convert a bitmap to WebRTC I420 buffer format
     */
    private fun bitmapToI420Buffer(bitmap: Bitmap, width: Int, height: Int): JavaI420Buffer {
      // Get the pixel data from the bitmap
      val argbData = IntArray(width * height)
      bitmap.getPixels(argbData, 0, width, 0, 0, width, height)
      
      // Calculate chrominance plane dimensions
      val chromaWidth = (width + 1) / 2
      val chromaHeight = (height + 1) / 2
      
      // Create direct ByteBuffers as required by WebRTC
      val yBuffer = ByteBuffer.allocateDirect(width * height)
      val uBuffer = ByteBuffer.allocateDirect(chromaWidth * chromaHeight)
      val vBuffer = ByteBuffer.allocateDirect(chromaWidth * chromaHeight)
      
      // Prepare temporary arrays for YUV data
      val yData = ByteArray(width * height)
      val uData = ByteArray(chromaWidth * chromaHeight)
      val vData = ByteArray(chromaWidth * chromaHeight)
      
      // Convert ARGB to YUV
      for (y in 0 until height) {
        for (x in 0 until width) {
          val pixelIndex = y * width + x
          val argb = argbData[pixelIndex]
          
          // Extract RGB values
          val r = (argb shr 16) and 0xFF
          val g = (argb shr 8) and 0xFF
          val b = argb and 0xFF
          
          // Convert to YUV (BT.601 conversion)
          val yValue = ((66 * r + 129 * g + 25 * b + 128) shr 8) + 16
          
          // Store Y value in array first
          yData[pixelIndex] = yValue.toByte()
          
          // Subsample for U/V
          if (y % 2 == 0 && x % 2 == 0) {
            val uvIndex = (y / 2) * chromaWidth + (x / 2)
            
            val uValue = ((-38 * r - 74 * g + 112 * b + 128) shr 8) + 128
            val vValue = ((112 * r - 94 * g - 18 * b + 128) shr 8) + 128
            
            uData[uvIndex] = uValue.toByte()
            vData[uvIndex] = vValue.toByte()
          }
        }
      }
      
      // Copy data to direct buffers
      yBuffer.put(yData)
      uBuffer.put(uData)
      vBuffer.put(vData)
      
      // Reset buffer positions
      yBuffer.rewind()
      uBuffer.rewind()
      vBuffer.rewind()
      
      // Create the WebRTC buffer with the YUV data
      return JavaI420Buffer.wrap(
        width, height,
        yBuffer, width, // Y plane
        uBuffer, chromaWidth, // U plane
        vBuffer, chromaWidth, // V plane
        null // No release callback needed
      )
    }
  }
}
