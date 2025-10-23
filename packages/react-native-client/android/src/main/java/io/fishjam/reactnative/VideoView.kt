package io.fishjam.reactnative

import android.animation.ValueAnimator
import android.annotation.SuppressLint
import android.content.Context
import android.content.res.Resources
import android.graphics.Color
import android.graphics.Rect
import android.graphics.drawable.ColorDrawable
import android.os.Handler
import android.os.Looper
import android.view.animation.LinearInterpolator
import androidx.core.view.ViewCompat
import com.fishjamcloud.client.media.LocalVideoTrack
import com.fishjamcloud.client.media.VideoTrack
import com.fishjamcloud.client.ui.VideoSurfaceViewRenderer
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
  protected val videoView: VideoSurfaceViewRenderer = RNFishjamClient.fishjamClient.createVideoViewRenderer().also {
    it.setEnableHardwareScaler(true)
    addView(it)
  }

  private var scalingType = RendererCommon.ScalingType.SCALE_ASPECT_FIT
    set(value) {
      field = value
      videoView.setScalingType(scalingType)
      requestSurfaceViewRendererLayout()
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
        getVideoTrack()?.shouldReceive(true)
      } else {
        checkVisibilityHandler.post(checkVisibility)
      }
    }

  private val checkVisibility =
    object : Runnable {
      override fun run() {
        checkVisibilityDelayMillis?.let {
          getVideoTrack()?.shouldReceive(isVisibleOnScreen)
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
    scalingType =
      when (videoLayout) {
        "FILL" -> RendererCommon.ScalingType.SCALE_ASPECT_FILL
        "FIT" -> RendererCommon.ScalingType.SCALE_ASPECT_FIT
        else -> RendererCommon.ScalingType.SCALE_ASPECT_FILL
      }
  }

  open fun dispose() {
    checkVisibilityHandler.removeCallbacksAndMessages(null)
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

  /**
   * Inspired by:
   * https://github.com/react-native-webrtc/react-native-webrtc/blob/5ecc86111c2f8e0d152d719f8b7b357a601150b6/android/src/main/java/com/oney/WebRTCModule/WebRTCView.java#L292
   */
  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    super.onLayout(changed, l, t, r, b)

    var left = l
    var top = t
    var right = r
    var bottom = b

    val height = b - t
    val width = r - l

    if (height == 0 || width == 0) {
      left = 0
      top = 0
      right = 0
      bottom = 0
    } else {
      val frameHeight = videoView.rotatedFrameHeight
      val frameWidth = videoView.rotatedFrameWidth

      when (scalingType) {
        RendererCommon.ScalingType.SCALE_ASPECT_FILL -> {
          // Fill this ViewGroup with videoView and the latter
          // will take care of filling itself with the video similarly to
          // the cover value the CSS property object-fit.
          left = 0
          top = 0
          right = width
          bottom = height
        }
        RendererCommon.ScalingType.SCALE_ASPECT_FIT -> {
          // Lay videoView out inside this ViewGroup in accord
          // with the contain value of the CSS property object-fit.
          // VideoView will fill itself with the video similarly
          // to the cover or contain value of the CSS property object-fit
          // (which will not matter, eventually).
          if (frameHeight == 0 || frameWidth == 0) {
            left = 0
            top = 0
            right = 0
            bottom = 0
          } else {
            val frameAspectRatio = frameWidth.toFloat() / frameHeight.toFloat()
            val frameDisplaySize = RendererCommon.getDisplaySize(
              scalingType,
              frameAspectRatio,
              width,
              height
            )

            left = (width - frameDisplaySize.x) / 2
            top = (height - frameDisplaySize.y) / 2
            right = left + frameDisplaySize.x
            bottom = top + frameDisplaySize.y
          }
        }
        else -> {
          // Default to SCALE_ASPECT_FIT behavior
          if (frameHeight == 0 || frameWidth == 0) {
            left = 0
            top = 0
            right = 0
            bottom = 0
          } else {
            val frameAspectRatio = frameWidth.toFloat() / frameHeight.toFloat()
            val frameDisplaySize = RendererCommon.getDisplaySize(
              scalingType,
              frameAspectRatio,
              width,
              height
            )

            left = (width - frameDisplaySize.x) / 2
            top = (height - frameDisplaySize.y) / 2
            right = left + frameDisplaySize.x
            bottom = top + frameDisplaySize.y
          }
        }
      }
    }

    videoView.layout(left, top, right, bottom)
  }

  /**
   * Inspired by:
   * https://github.com/react-native-webrtc/react-native-webrtc/blob/5ecc86111c2f8e0d152d719f8b7b357a601150b6/android/src/main/java/com/oney/WebRTCModule/WebRTCView.java#L386
   */
  @SuppressLint("WrongCall")
  private fun requestSurfaceViewRendererLayout() {
    // Google/WebRTC just call requestLayout() on surfaceViewRenderer when
    // they change the value of its mirror or surfaceType property.
    videoView.requestLayout()
    // The above is not enough though when the video frame's dimensions or
    // rotation change. The following will suffice.
    if (!ViewCompat.isInLayout(this)) {
      onLayout( /* changed */
        false, left, top, right, bottom
      )
    }
  }

  fun setupTrack() {
    videoView.setMirror((getVideoTrack() as? LocalVideoTrack)?.isFrontCamera() ?: false)
    checkVisibilityHandler.post(checkVisibility)
  }
}
