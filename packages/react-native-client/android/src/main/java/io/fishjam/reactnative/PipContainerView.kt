package io.fishjam.reactnative

import android.app.PictureInPictureParams
import android.content.Context
import android.os.Build
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.annotation.RequiresApi
import androidx.fragment.app.FragmentActivity
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import io.fishjam.reactnative.helpers.PictureInPictureHelperFragment

class PipContainerView(
  context: Context,
  appContext: AppContext
) : ExpoView(context, appContext) {
  private val currentActivity = appContext.currentActivity
  private val decorView = currentActivity?.window?.decorView
  private val rootView = decorView?.findViewById<ViewGroup>(android.R.id.content)
  private val rootViewChildrenOriginalVisibility: ArrayList<Int> = arrayListOf()
  private var pictureInPictureHelperTag: String? = null

  private var activeTrackId: String? = null
  private var activeVideoRendererView: VideoRendererView? = null
  private var originalParent: ViewGroup? = null
  private var originalLayoutParams: ViewGroup.LayoutParams? = null

  @RequiresApi(Build.VERSION_CODES.O)
  private var pictureInPictureParamsBuilder = PictureInPictureParams.Builder()

  var startAutomatically: Boolean = true
    set(value) {
      field = value
      updateAutoEnterEnabled()
    }

  var stopAutomatically: Boolean = true

  @RequiresApi(Build.VERSION_CODES.O)
  private fun updatePictureInPictureParams() {
    try {
      currentActivity?.setPictureInPictureParams(pictureInPictureParamsBuilder.build())
    } catch (e: IllegalStateException) {
      emitPipNotSupportedWarning()
    }
  }

  private fun emitPipNotSupportedWarning() {
    RNFishjamClient.sendEvent(
      EmitableEvent.warning(
        "Picture-in-Picture is not supported. Enable it in app.json."
      )
    )
  }

  @RequiresApi(Build.VERSION_CODES.S)
  private fun updateAutoEnterEnabled() {
    pictureInPictureParamsBuilder.setAutoEnterEnabled(startAutomatically)
    updatePictureInPictureParams()
  }

  fun setPictureInPictureActiveTrackId(trackId: String) {
    activeTrackId = trackId
  }

  @RequiresApi(Build.VERSION_CODES.O)
  fun startPictureInPicture() {
    try {
      currentActivity?.enterPictureInPictureMode(pictureInPictureParamsBuilder.build())
    } catch (e: IllegalStateException) {
      emitPipNotSupportedWarning()
    }
  }

  fun stopPictureInPicture() {
    // No direct API on Android to exit PiP programmatically
    // User must use back button or system gesture
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    (currentActivity as? FragmentActivity)?.let {
      val fragment = PictureInPictureHelperFragment(this)
      pictureInPictureHelperTag = fragment.id
      it.supportFragmentManager.beginTransaction()
        .add(fragment, fragment.id)
        .commitAllowingStateLoss()
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      updateAutoEnterEnabled()
    }
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    (currentActivity as? FragmentActivity)?.let {
      val fragment = it.supportFragmentManager.findFragmentByTag(pictureInPictureHelperTag ?: "")
        ?: return
      it.supportFragmentManager.beginTransaction()
        .remove(fragment)
        .commitAllowingStateLoss()
    }
  }

  fun layoutForPiPEnter() {
    if (rootView == null) return

    // Find the VideoRendererView with the matching trackId
    val targetView = findVideoRendererViewByTrackId(activeTrackId)

    if (targetView == null) {
      // If no specific track is set, try to find any VideoRendererView child
      activeVideoRendererView = findFirstVideoRendererView()
    } else {
      activeVideoRendererView = targetView
    }

    activeVideoRendererView?.let { videoView ->
      // Store the original parent and layout params
      originalParent = videoView.parent as? ViewGroup
      originalLayoutParams = videoView.layoutParams

      // Remove from current parent
      originalParent?.removeView(videoView)

      // Hide all root view children except the video view
      for (i in 0 until rootView.childCount) {
        val child = rootView.getChildAt(i)
        if (child != videoView) {
          rootViewChildrenOriginalVisibility.add(child.visibility)
          child.visibility = View.GONE
        }
      }

      // Add video view to root view
      rootView.addView(
        videoView,
        FrameLayout.LayoutParams(
          ViewGroup.LayoutParams.MATCH_PARENT,
          ViewGroup.LayoutParams.MATCH_PARENT
        )
      )
    }
  }

  fun layoutForPiPExit() {
    if (rootView == null) return

    activeVideoRendererView?.let { videoView ->
      // Remove from root view
      rootView.removeView(videoView)

      // Restore visibility of other root view children
      var visibilityIndex = 0
      for (i in 0 until rootView.childCount) {
        val child = rootView.getChildAt(i)
        if (visibilityIndex < rootViewChildrenOriginalVisibility.size) {
          child.visibility = rootViewChildrenOriginalVisibility[visibilityIndex]
          visibilityIndex++
        }
      }
      rootViewChildrenOriginalVisibility.clear()

      // Restore video view to original parent
      originalParent?.let { parent ->
        val params = originalLayoutParams ?: ViewGroup.LayoutParams(
          ViewGroup.LayoutParams.MATCH_PARENT,
          ViewGroup.LayoutParams.MATCH_PARENT
        )
        parent.addView(videoView, params)
      }

      // Clean up references
      activeVideoRendererView = null
      originalParent = null
      originalLayoutParams = null
    }
  }

  private fun findVideoRendererViewByTrackId(trackId: String?): VideoRendererView? {
    if (trackId == null) return null

    for (i in 0 until childCount) {
      val child = getChildAt(i)
      if (child is VideoRendererView && child.getTrackId() == trackId) {
        return child
      }
    }
    return null
  }

  private fun findFirstVideoRendererView(): VideoRendererView? {
    for (i in 0 until childCount) {
      val child = getChildAt(i)
      if (child is VideoRendererView) {
        return child
      }
    }
    return null
  }
}

