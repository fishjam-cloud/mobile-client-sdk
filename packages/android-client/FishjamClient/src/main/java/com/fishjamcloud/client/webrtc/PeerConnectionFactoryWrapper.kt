package com.fishjamcloud.client.webrtc

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat
import com.fishjamcloud.client.media.CameraCapturer
import com.fishjamcloud.client.media.SimulcastVideoEncoderFactoryWrapper
import com.fishjamcloud.client.models.EncoderOptions
import com.fishjamcloud.client.models.VideoParameters
import com.fishjamcloud.client.ui.VideoSurfaceViewRenderer
import org.webrtc.AudioSource
import org.webrtc.AudioTrack
import org.webrtc.DefaultVideoDecoderFactory
import org.webrtc.EglBase
import org.webrtc.MediaConstraints
import org.webrtc.PeerConnection
import org.webrtc.PeerConnectionFactory
import org.webrtc.ScreenCapturerAndroid
import org.webrtc.SurfaceTextureHelper
import org.webrtc.VideoSource
import org.webrtc.VideoTrack
import org.webrtc.audio.AudioDeviceModule
import java.util.UUID

internal class PeerConnectionFactoryWrapper(
  encoderOptions: EncoderOptions,
  audioDeviceModule: AudioDeviceModule,
  private val appContext: Context
) {
  private val peerConnectionFactory: PeerConnectionFactory
  private val eglBase: EglBase

  init {
    PeerConnectionFactory.initialize(
      PeerConnectionFactory.InitializationOptions
        .builder(appContext)
        .setFieldTrials("WebRTC-Network-UseNWPathMonitor/Disabled/")
        .setEnableInternalTracer(false)
        .createInitializationOptions()
    )

    eglBase = EglBase.create()

    peerConnectionFactory =
      PeerConnectionFactory
        .builder()
        .setAudioDeviceModule(audioDeviceModule)
        .setVideoEncoderFactory(
          SimulcastVideoEncoderFactoryWrapper(
            eglBase.eglBaseContext,
            encoderOptions
          )
        ).setVideoDecoderFactory(DefaultVideoDecoderFactory(eglBase.eglBaseContext))
        .createPeerConnectionFactory()
  }

  fun createPeerConnection(
    rtcConfig: PeerConnection.RTCConfiguration,
    observer: PeerConnection.Observer
  ): PeerConnection? = peerConnectionFactory.createPeerConnection(rtcConfig, observer)

  fun createVideoSource(isScreencast: Boolean): VideoSource = peerConnectionFactory.createVideoSource(isScreencast)

  fun createVideoTrack(source: VideoSource): VideoTrack = peerConnectionFactory.createVideoTrack(UUID.randomUUID().toString(), source)

  fun createVideoCapturer(
    source: VideoSource,
    videoParameters: VideoParameters,
    captureDeviceName: String? = null
  ): CameraCapturer =
    CameraCapturer(
      context = appContext,
      source = source,
      rootEglBase = eglBase,
      videoParameters = videoParameters,
      captureDeviceName
    )

  fun createAudioSource(): AudioSource {
    if (ContextCompat.checkSelfPermission(appContext, Manifest.permission.RECORD_AUDIO) !=
      PackageManager.PERMISSION_GRANTED
    ) {
      throw SecurityException("Missing permissions to start recording the audio")
    }

    val items =
      listOf(
        MediaConstraints.KeyValuePair("googEchoCancellation", "true"),
        MediaConstraints.KeyValuePair("googAutoGainControl", "true"),
        MediaConstraints.KeyValuePair("googHighpassFilter", "true"),
        MediaConstraints.KeyValuePair("googNoiseSuppression", "true"),
        MediaConstraints.KeyValuePair("googTypingNoiseDetection", "true")
      )

    val audioConstraints = MediaConstraints()
    audioConstraints.optional.addAll(items)

    return peerConnectionFactory.createAudioSource(audioConstraints)
  }

  fun createAudioTrack(audioSource: AudioSource): AudioTrack =
    peerConnectionFactory.createAudioTrack(UUID.randomUUID().toString(), audioSource)

  fun createScreenCapturer(
    source: VideoSource,
    callback: com.fishjamcloud.client.media.LocalScreenShareTrack.ProjectionCallback,
    mediaProjectionPermission: Intent
  ): ScreenCapturerAndroid {
    val capturer = ScreenCapturerAndroid(mediaProjectionPermission, callback)

    capturer.initialize(
      SurfaceTextureHelper.create("ScreenVideoCaptureThread", eglBase.eglBaseContext),
      appContext,
      source.capturerObserver
    )

    return capturer
  }

  fun createVideoViewRenderer(): VideoSurfaceViewRenderer {
    val renderer = VideoSurfaceViewRenderer(appContext)
    renderer.init(eglBase.eglBaseContext, null)
    return renderer
  }
}
