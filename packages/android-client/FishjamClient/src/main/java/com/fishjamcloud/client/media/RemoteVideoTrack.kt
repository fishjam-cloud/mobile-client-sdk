package com.fishjamcloud.client.media

import com.fishjamcloud.client.models.EncoderOptions
import com.fishjamcloud.client.models.EncoderType
import com.fishjamcloud.client.models.EncodingReason
import com.fishjamcloud.client.models.Metadata
import com.fishjamcloud.client.models.TrackEncoding
import org.webrtc.EglBase
import org.webrtc.HardwareVideoEncoderFactory
import org.webrtc.SimulcastVideoEncoderFactory
import org.webrtc.SoftwareVideoEncoderFactory
import org.webrtc.VideoCodecInfo
import org.webrtc.VideoCodecStatus
import org.webrtc.VideoEncoder
import org.webrtc.VideoEncoderFactory
import org.webrtc.VideoEncoderFallback
import org.webrtc.VideoFrame
import org.webrtc.WrappedNativeVideoEncoder
import java.util.UUID
import java.util.concurrent.Callable
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

fun interface OnEncodingChangedListener {
  fun onEncodingChanged(trackContext: RemoteVideoTrack)
}

class RemoteVideoTrack(
  videoTrack: org.webrtc.VideoTrack,
  endpointId: String,
  rtcEngineId: String?,
  metadata: Metadata,
  id: String = UUID.randomUUID().toString()
) : VideoTrack(videoTrack, endpointId, rtcEngineId, metadata, id) {
  private var onTrackEncodingChangeListener: (OnEncodingChangedListener)? = null

  /**
   *  Encoding that is currently received. Only present for remote tracks.
   */
  var encoding: TrackEncoding? = null
    private set

  /**
   * The reason of currently selected encoding. Only present for remote tracks.
   */
  var encodingReason: EncodingReason? = null
    private set

  internal fun setEncoding(
    encoding: TrackEncoding,
    encodingReason: EncodingReason
  ) {
    this.encoding = encoding
    this.encodingReason = encodingReason
    onTrackEncodingChangeListener?.let { onTrackEncodingChangeListener?.onEncodingChanged(this) }
  }

  /**
   * Sets listener that is called each time track encoding has changed.
   *
   * Track encoding can change in the following cases:
   * - when user requested a change
   * - when sender stopped sending some encoding (because of bandwidth change)
   * - when receiver doesn't have enough bandwidth
   * Some of those reasons are indicated in TrackContext.encodingReason
   */
  fun setOnEncodingChangedListener(listener: OnEncodingChangedListener?) {
    listener?.onEncodingChanged(this)
    onTrackEncodingChangeListener = listener
  }
}

internal open class SimulcastVideoEncoderFactoryWrapper(
  sharedContext: EglBase.Context?,
  encoderOptions: EncoderOptions
) : VideoEncoderFactory {
  /**
   * Factory that prioritizes software encoder.
   *
   * When the selected codec can't be handled by the software encoder,
   * it uses the hardware encoder as a fallback. However, this class is
   * primarily used to address an issue in libwebrtc, and does not have
   * purposeful usecase itself.
   *
   * To use simulcast in libwebrtc, SimulcastEncoderAdapter is used.
   * SimulcastEncoderAdapter takes in a primary and fallback encoder.
   * If HardwareVideoEncoderFactory and SoftwareVideoEncoderFactory are
   * passed in directly as primary and fallback, when H.264 is used,
   * libwebrtc will crash.
   *
   * This is because SoftwareVideoEncoderFactory does not handle H.264,
   * so [SoftwareVideoEncoderFactory.createEncoder] returns null, and
   * the libwebrtc side does not handle nulls, regardless of whether the
   * fallback is actually used or not.
   *
   * To avoid nulls, we simply pass responsibility over to the HardwareVideoEncoderFactory.
   * This results in HardwareVideoEncoderFactory being both the primary and fallback,
   * but there aren't any specific problems in doing so.
   */
  private class FallbackFactory(
    private val hardwareVideoEncoderFactory: VideoEncoderFactory
  ) : VideoEncoderFactory {
    private val softwareVideoEncoderFactory: VideoEncoderFactory = SoftwareVideoEncoderFactory()

    override fun createEncoder(info: VideoCodecInfo): VideoEncoder? {
      val softwareEncoder = softwareVideoEncoderFactory.createEncoder(info)
      val hardwareEncoder = hardwareVideoEncoderFactory.createEncoder(info)
      return if (hardwareEncoder != null && softwareEncoder != null) {
        VideoEncoderFallback(hardwareEncoder, softwareEncoder)
      } else {
        softwareEncoder ?: hardwareEncoder
      }
    }

    override fun getSupportedCodecs(): Array<VideoCodecInfo> {
      val supportedCodecInfos: MutableList<VideoCodecInfo> = mutableListOf()
      supportedCodecInfos.addAll(softwareVideoEncoderFactory.supportedCodecs)
      supportedCodecInfos.addAll(hardwareVideoEncoderFactory.supportedCodecs)
      return supportedCodecInfos.toTypedArray()
    }
  }

  /**
   * Wraps each stream encoder and performs the following:
   * - Starts up a single thread
   * - When the width/height from [initEncode] doesn't match the frame buffer's,
   *   scales the frame prior to encoding.
   * - Always calls the encoder on the thread.
   */
  private class StreamEncoderWrapper(
    private val encoder: VideoEncoder
  ) : VideoEncoder {
    val executor: ExecutorService = Executors.newSingleThreadExecutor()
    var streamSettings: VideoEncoder.Settings? = null

    override fun initEncode(
      settings: VideoEncoder.Settings,
      callback: VideoEncoder.Callback?
    ): VideoCodecStatus {
      streamSettings = settings

      val future =
        executor.submit(
          Callable {
            return@Callable encoder.initEncode(settings, callback)
          }
        )
      return future.get()
    }

    override fun release(): VideoCodecStatus {
      val future = executor.submit(Callable { return@Callable encoder.release() })
      return future.get()
    }

    override fun encode(
      frame: VideoFrame,
      encodeInfo: VideoEncoder.EncodeInfo?
    ): VideoCodecStatus {
      val future =
        executor.submit(
          Callable {
            if (streamSettings == null) {
              return@Callable encoder.encode(frame, encodeInfo)
            } else if (frame.buffer.width == streamSettings!!.width) {
              return@Callable encoder.encode(frame, encodeInfo)
            } else {
              // The incoming buffer is different than the streamSettings received in initEncode()
              // Need to scale.
              val originalBuffer = frame.buffer
              // TODO: Do we need to handle when the scale factor is weird?
              val adaptedBuffer =
                originalBuffer.cropAndScale(
                  0,
                  0,
                  originalBuffer.width,
                  originalBuffer.height,
                  streamSettings!!.width,
                  streamSettings!!.height
                )
              val adaptedFrame = VideoFrame(adaptedBuffer, frame.rotation, frame.timestampNs)
              val result = encoder.encode(adaptedFrame, encodeInfo)
              adaptedBuffer.release()
              return@Callable result
            }
          }
        )
      return future.get()
    }

    override fun setRateAllocation(
      allocation: VideoEncoder.BitrateAllocation?,
      frameRate: Int
    ): VideoCodecStatus {
      val future =
        executor.submit(
          Callable {
            return@Callable encoder.setRateAllocation(
              allocation,
              frameRate
            )
          }
        )
      return future.get()
    }

    override fun getScalingSettings(): VideoEncoder.ScalingSettings {
      val future = executor.submit(Callable { return@Callable encoder.scalingSettings })
      return future.get()
    }

    override fun getImplementationName(): String {
      val future = executor.submit(Callable { return@Callable encoder.implementationName })
      return future.get()
    }

    override fun createNative(webrtcEnvRef: Long): Long {
      val future = executor.submit(Callable { return@Callable encoder.createNative(webrtcEnvRef) })
      return future.get()
    }

    override fun isHardwareEncoder(): Boolean {
      val future = executor.submit(Callable { return@Callable encoder.isHardwareEncoder })
      return future.get()
    }

    override fun setRates(rcParameters: VideoEncoder.RateControlParameters?): VideoCodecStatus {
      val future = executor.submit(Callable { return@Callable encoder.setRates(rcParameters) })
      return future.get()
    }

    override fun getResolutionBitrateLimits(): Array<VideoEncoder.ResolutionBitrateLimits> {
      val future = executor.submit(Callable { return@Callable encoder.resolutionBitrateLimits })
      return future.get()
    }

    override fun getEncoderInfo(): VideoEncoder.EncoderInfo {
      val future = executor.submit(Callable { return@Callable VideoEncoder.EncoderInfo(2, true) })
      return future.get()
    }
  }

  private class StreamEncoderWrapperFactory(
    private val factory: VideoEncoderFactory
  ) : VideoEncoderFactory {
    override fun createEncoder(videoCodecInfo: VideoCodecInfo?): VideoEncoder? {
      val encoder = factory.createEncoder(videoCodecInfo) ?: return null
      if (encoder is WrappedNativeVideoEncoder) {
        return encoder
      }
      return StreamEncoderWrapper(encoder)
    }

    override fun getSupportedCodecs(): Array<VideoCodecInfo> = factory.supportedCodecs
  }

  private val primary: VideoEncoderFactory
  private val fallback: VideoEncoderFactory
  private val native: SimulcastVideoEncoderFactory

  init {
    val hardwareVideoEncoderFactory =
      HardwareVideoEncoderFactory(
        sharedContext,
        encoderOptions.enableIntelVp8Encoder,
        encoderOptions.enableH264HighProfile
      )
    val softwareVideoEncoderFactory = SoftwareVideoEncoderFactory()
    primary = StreamEncoderWrapperFactory(hardwareVideoEncoderFactory)
    fallback = StreamEncoderWrapperFactory(FallbackFactory(primary))
    native =
      if (encoderOptions.encoderType == EncoderType.HARDWARE) {
        SimulcastVideoEncoderFactory(
          StreamEncoderWrapperFactory(hardwareVideoEncoderFactory),
          fallback
        )
      } else {
        SimulcastVideoEncoderFactory(
          StreamEncoderWrapperFactory(softwareVideoEncoderFactory),
          fallback
        )
      }
  }

  override fun createEncoder(info: VideoCodecInfo?): VideoEncoder? = native.createEncoder(info)

  override fun getSupportedCodecs(): Array<VideoCodecInfo> = native.supportedCodecs
}
