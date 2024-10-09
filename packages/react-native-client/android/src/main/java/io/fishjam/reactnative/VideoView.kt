package io.fishjam.reactnative

import android.animation.ValueAnimator
import android.content.Context
import android.content.res.Resources
import android.graphics.Color
import android.graphics.Rect
import android.graphics.drawable.ColorDrawable
import android.os.Handler
import android.os.Looper
import android.view.animation.LinearInterpolator
import com.fishjamcloud.client.media.LocalVideoTrack
import com.fishjamcloud.client.media.VideoTrack
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import io.fishjam.reactnative.managers.LocalTrackSwitchListener
import kotlinx.coroutines.delay
import org.webrtc.RendererCommon

abstract class VideoView(
  context: Context,
  appContext: AppContext
) : ExpoView(context, appContext),
  LocalTrackSwitchListener {
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

  private val checkVisibilityHandler: Handler = Handler(Looper.getMainLooper())

  // If set to `null` the view will always be rendered
  var checkVisibilityDelayMillis: Long? = null
    set(value) {
      field = value
      if (value == null) {
        getVideoTrack()?.setShouldReceive(true)
      } else {
        checkVisibilityHandler.post(checkVisibility)
      }
    }

  private val checkVisibility =
    object : Runnable {
      override fun run() {
        checkVisibilityDelayMillis?.let {
          getVideoTrack()?.setShouldReceive(isVisibleOnScreen)
          checkVisibilityHandler.postDelayed(this, it)
        }
      }
    }

  private val isVisibleOnScreen: Boolean
    get() {
      if (!isShown) {
        return false
      }

      val globalVisibleRect = Rect()
      getGlobalVisibleRect(globalVisibleRect)
      val displayMetrics = Resources.getSystem().displayMetrics
      val screen = Rect(0, 0, displayMetrics.widthPixels, displayMetrics.heightPixels)
      return screen.intersect(globalVisibleRect)
    }

  init {
    RNFishjamClient.localTracksSwitchListenerManager.add(this)
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
    checkVisibilityHandler.post(checkVisibility)
  }
}
