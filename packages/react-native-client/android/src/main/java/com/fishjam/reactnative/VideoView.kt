package io.fishjam.reactnative

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.view.animation.LinearInterpolator
import com.fishjamcloud.client.media.LocalVideoTrack
import com.fishjamcloud.client.media.VideoTrack
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import org.webrtc.RendererCommon

abstract class VideoView(
  context: Context,
  appContext: AppContext
) : ExpoView(context, appContext),
  RNFishjamClient.OnLocalTrackSwitchListener {
  protected val videoView =
    RNFishjamClient.fishjamClient.createVideoViewRenderer().also {
      addView(it)
    }

  private val fadeAnimation: ValueAnimator =
    ValueAnimator.ofArgb(Color.TRANSPARENT, Color.BLACK).apply {
      duration = 200
      interpolator = LinearInterpolator()
      addUpdateListener {
        val colorValue = it.animatedValue as Int
        foreground = ColorDrawable(colorValue)
      }
    }

  val coroutineScope: CoroutineScope = CoroutineScope(Dispatchers.Main)

  init {
    RNFishjamClient.onLocalTrackSwitchListener.add(this)
  }

  fun setVideoLayout(videoLayout: String) {
    val scalingType =
      when (videoLayout) {
        "FILL" -> RendererCommon.ScalingType.SCALE_ASPECT_FILL
        "FIT" -> RendererCommon.ScalingType.SCALE_ASPECT_FIT
        else -> RendererCommon.ScalingType.SCALE_ASPECT_FILL
      }
    videoView.setScalingType(scalingType)
    videoView.setEnableHardwareScaler(true)
  }

  open fun dispose() {
    videoView.release()
  }

  protected abstract fun getVideoTrack(): VideoTrack?

  override suspend fun onLocalTrackWillSwitch() {
    if (getVideoTrack() is LocalVideoTrack) {
      fadeAnimation.start()
    }
  }

  override suspend fun onLocalTrackSwitched() {
    if (getVideoTrack() is LocalVideoTrack) {
      videoView.setMirror((getVideoTrack() as? LocalVideoTrack)?.isFrontCamera() ?: false)
      delay(500)
      fadeAnimation.reverse()
    }
  }

  fun setupTrack() {
    videoView.setMirror((getVideoTrack() as? LocalVideoTrack)?.isFrontCamera() ?: false)
  }
}
