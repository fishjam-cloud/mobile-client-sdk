package io.fishjam.reactnative

import android.app.PictureInPictureParams
import android.content.Context
import android.graphics.Color
import android.os.Build
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.annotation.RequiresApi
import androidx.fragment.app.FragmentActivity
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import fishjam.media_events.server.Server
import io.fishjam.reactnative.helpers.PictureInPictureHelperFragment
import io.fishjam.reactnative.managers.TrackUpdateListener

class PipContainerView(
  context: Context,
  appContext: AppContext
) : ExpoView(context, appContext), TrackUpdateListener {
  private val currentActivity = appContext.currentActivity
  private val decorView = currentActivity?.window?.decorView
  private val rootView = decorView?.findViewById<ViewGroup>(android.R.id.content)
  private val rootViewChildrenOriginalVisibility: ArrayList<Int> = arrayListOf()
  private var pictureInPictureHelperTag: String? = null

  private var primaryVideoView: VideoRendererView? = null
  private var secondaryVideoView: VideoRendererView? = null
  private var primaryPlaceholder: android.widget.TextView? = null
  private var secondaryPlaceholder: android.widget.TextView? = null
  private var splitScreenContainer: android.widget.LinearLayout? = null

  @RequiresApi(Build.VERSION_CODES.O)
  private var pictureInPictureParamsBuilder = PictureInPictureParams.Builder()

  var startAutomatically: Boolean = true
    set(value) {
      field = value
      updateAutoEnterEnabled()
    }

  var stopAutomatically: Boolean = true

  var primaryPlaceholderText: String = "No camera"
    set(value) {
      field = value
      primaryPlaceholder?.text = value
    }

  var secondaryPlaceholderText: String = "No active speaker"
    set(value) {
      field = value
      secondaryPlaceholder?.text = value
    }

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

  private fun findLocalCameraTrack(): com.fishjamcloud.client.media.VideoTrack? {
    val peers = RNFishjamClient.getAllPeers()
    val localEndpointId = RNFishjamClient.fishjamClient.getLocalEndpoint().id
    val localPeer = peers.firstOrNull { it.id == localEndpointId } ?: return null
    
    return localPeer.tracks.values.firstOrNull { track ->
      track is com.fishjamcloud.client.media.VideoTrack && 
      (track.metadata as? Map<*, *>)?.get("type") == "camera"
    } as? com.fishjamcloud.client.media.VideoTrack
  }

  private fun findRemoteVadActiveTrack(): com.fishjamcloud.client.media.VideoTrack? {
    val peers = RNFishjamClient.getAllPeers()
    val localEndpointId = RNFishjamClient.fishjamClient.getLocalEndpoint().id
    val remotePeers = peers.filter { it.id != localEndpointId }
    
    // First pass: look for active VAD
    for (peer in remotePeers) {
      // Find if this peer has an active VAD audio track
      val hasActiveVad = peer.tracks.values.any { track ->
        track is com.fishjamcloud.client.media.RemoteAudioTrack && 
        track.vadStatus == Server.MediaEvent.VadNotification.Status.STATUS_SPEECH
      }
      
      if (hasActiveVad) {
        // Return the first video track from this peer
        return peer.tracks.values.firstOrNull { track ->
          track is com.fishjamcloud.client.media.VideoTrack
        } as? com.fishjamcloud.client.media.VideoTrack
      }
    }
    
    // Fallback: return first available remote video track
    for (peer in remotePeers) {
      val videoTrack = peer.tracks.values.firstOrNull { track ->
        track is com.fishjamcloud.client.media.VideoTrack
      } as? com.fishjamcloud.client.media.VideoTrack
      
      if (videoTrack != null) {
        return videoTrack
      }
    }
    
    return null
  }

  private fun updatePipViews() {
    val localCameraTrack = findLocalCameraTrack()
    val remoteVadTrack = findRemoteVadActiveTrack()
    
    // Update primary view (local camera)
    if (localCameraTrack != null) {
      if (primaryVideoView == null) {
        primaryVideoView = VideoRendererView(context, appContext)
      }
      primaryVideoView?.let { view ->
        view.init(localCameraTrack.id())
      }
      primaryPlaceholder?.visibility = View.GONE
    } else {
      primaryVideoView = null
      primaryPlaceholder?.visibility = View.VISIBLE
    }
    
    // Update secondary view (remote VAD)
    if (remoteVadTrack != null) {
      if (secondaryVideoView == null) {
        secondaryVideoView = VideoRendererView(context, appContext)
      }
      secondaryVideoView?.let { view ->
        view.init(remoteVadTrack.id())
      }
      secondaryPlaceholder?.visibility = View.GONE
    } else {
      secondaryVideoView = null
      secondaryPlaceholder?.visibility = View.VISIBLE
    }
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
    
    // Register for track updates
    RNFishjamClient.trackUpdateListenersManager.add(this)
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
    
    // Unregister from track updates
    RNFishjamClient.trackUpdateListenersManager.remove(this)
  }

  override fun onTracksUpdate() {
    updatePipViews()
  }

  private fun createPlaceholderTextView(text: String): TextView {
    return TextView(context).apply {
      this.text = text
      setTextColor(Color.WHITE)
      gravity = Gravity.CENTER
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
      setBackgroundColor(Color.parseColor("#606060"))
    }
  }

  private fun createSplitScreenContainer(): LinearLayout {
    val container = LinearLayout(context).apply {
      orientation = LinearLayout.HORIZONTAL
      layoutParams = FrameLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT
      )
    }

    // Create primary container (left)
    val primaryContainer = FrameLayout(context).apply {
      layoutParams = LinearLayout.LayoutParams(
        0,
        ViewGroup.LayoutParams.MATCH_PARENT,
        1f
      )
    }

    // Create secondary container (right)
    val secondaryContainer = FrameLayout(context).apply {
      layoutParams = LinearLayout.LayoutParams(
        0,
        ViewGroup.LayoutParams.MATCH_PARENT,
        1f
      )
    }

    // Create placeholders
    primaryPlaceholder = createPlaceholderTextView(primaryPlaceholderText)
    secondaryPlaceholder = createPlaceholderTextView(secondaryPlaceholderText)

    primaryContainer.addView(
      primaryPlaceholder,
      FrameLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT
      )
    )

    secondaryContainer.addView(
      secondaryPlaceholder,
      FrameLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT
      )
    )

    // Add video views if available
    primaryVideoView?.let {
      primaryContainer.addView(
        it,
        FrameLayout.LayoutParams(
          ViewGroup.LayoutParams.MATCH_PARENT,
          ViewGroup.LayoutParams.MATCH_PARENT
        )
      )
      primaryPlaceholder?.visibility = View.GONE
    }

    secondaryVideoView?.let {
      secondaryContainer.addView(
        it,
        FrameLayout.LayoutParams(
          ViewGroup.LayoutParams.MATCH_PARENT,
          ViewGroup.LayoutParams.MATCH_PARENT
        )
      )
      secondaryPlaceholder?.visibility = View.GONE
    }

    container.addView(primaryContainer)
    container.addView(secondaryContainer)

    return container
  }

  fun layoutForPiPEnter() {
    if (rootView == null) return

    // Update tracks before entering PiP
    updatePipViews()

    // Hide all root view children
    for (i in 0 until rootView.childCount) {
      val child = rootView.getChildAt(i)
      rootViewChildrenOriginalVisibility.add(child.visibility)
      child.visibility = View.GONE
    }

    // Create and add split screen container
    splitScreenContainer = createSplitScreenContainer()
    rootView.addView(splitScreenContainer)
  }

  fun layoutForPiPExit() {
    if (rootView == null) return

    // Remove split screen container
    splitScreenContainer?.let { container ->
      rootView.removeView(container)
    }

    // Clean up video views
    primaryVideoView?.dispose()
    secondaryVideoView?.dispose()
    primaryVideoView = null
    secondaryVideoView = null
    primaryPlaceholder = null
    secondaryPlaceholder = null
    splitScreenContainer = null

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
  }

}

