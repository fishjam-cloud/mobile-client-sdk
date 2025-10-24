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
import android.widget.RelativeLayout
import android.widget.TextView
import androidx.annotation.RequiresApi
import androidx.fragment.app.FragmentActivity
import com.fishjamcloud.client.media.Track
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import fishjam.media_events.server.Server
import io.fishjam.reactnative.helpers.PictureInPictureHelperFragment
import io.fishjam.reactnative.managers.TrackUpdateListener

data class RemoteTrackInfo(
  val videoTrack: com.fishjamcloud.client.media.VideoTrack?,
  val displayName: String?,
  val hasVideoTrack: Boolean
)

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
  private var primaryContainer: RelativeLayout? = null
  private var secondaryContainer: RelativeLayout? = null

  private var isPipActive = false

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

  var remoteTrackInfo: RemoteTrackInfo? = null

  private fun assignSecondaryTrack() {
    val peers = RNFishjamClient.getAllPeers()
    val localEndpointId = RNFishjamClient.fishjamClient.getLocalEndpoint().id
    val remotePeers = peers.filter { it.id != localEndpointId }

    if (remotePeers.count() == 0) {
      remoteTrackInfo = null
      return
    }

    // First pass: look for active VAD
    for (peer in remotePeers) {
      // Find if this peer has an active VAD audio track
      val hasActiveVad = peer.tracks.values.any { track ->
        track is com.fishjamcloud.client.media.RemoteAudioTrack &&
          track.vadStatus == Server.MediaEvent.VadNotification.Status.STATUS_SPEECH
      }

      if (hasActiveVad) {
        val videoTrack = peer.tracks.values.firstOrNull { track ->
          track is com.fishjamcloud.client.media.VideoTrack
        } as? com.fishjamcloud.client.media.VideoTrack

        val displayName = (peer.metadata?.get("displayName") ?: peer.metadata?.get("name") ?: peer.id) as? String ?: peer.id

        remoteTrackInfo = RemoteTrackInfo(
          videoTrack = videoTrack,
          displayName = displayName,
          hasVideoTrack = videoTrack != null
        )
        return
      }
    }

    if (remoteTrackInfo != null) {
      for (peer in remotePeers) {
        if (peer.tracks.values.contains(remoteTrackInfo!!.videoTrack as Track)) {
          return
        }
      }
    }

    for (peer in remotePeers) {
      val videoTrack = peer.tracks.values.firstOrNull { track ->
        track is com.fishjamcloud.client.media.VideoTrack
      } as? com.fishjamcloud.client.media.VideoTrack

      if (videoTrack != null) {
        val displayName = (peer.metadata?.get("displayName") ?: peer.metadata?.get("name") ?: peer.id) as? String ?: peer.id
        remoteTrackInfo = RemoteTrackInfo(
          videoTrack = videoTrack,
          displayName = displayName,
          hasVideoTrack = true
        )
        return
      }
    }
  }

  private fun updatePipViews() {
    val localCameraTrack = findLocalCameraTrack()
    assignSecondaryTrack()

    if (localCameraTrack != null) {
      primaryVideoView?.init(localCameraTrack.id())
      primaryVideoView?.visibility = View.VISIBLE
      primaryPlaceholder?.visibility = View.GONE
    } else {
      primaryVideoView?.visibility = View.GONE
      primaryPlaceholder?.visibility = View.VISIBLE
    }

    if (remoteTrackInfo != null) {
      if (remoteTrackInfo!!.hasVideoTrack) {
        secondaryVideoView?.init(remoteTrackInfo!!.videoTrack!!.id())
        secondaryVideoView?.visibility = View.VISIBLE
        secondaryPlaceholder?.visibility = View.GONE
      } else {
        secondaryVideoView?.visibility = View.GONE
        secondaryPlaceholder?.text = remoteTrackInfo!!.displayName
        secondaryPlaceholder?.visibility = View.VISIBLE
      }
      secondaryContainer?.visibility = View.VISIBLE
    } else {
      secondaryVideoView?.visibility = View.GONE
      secondaryPlaceholder?.visibility = View.GONE
      secondaryContainer?.visibility = View.GONE
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

    startAutomatically = false

    RNFishjamClient.trackUpdateListenersManager.remove(this)
  }

  override fun onTracksUpdate() {
    if (isPipActive) {
      updatePipViews()
    }
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

    primaryContainer = RelativeLayout(context).apply {
      layoutParams = LinearLayout.LayoutParams(
        0,
        ViewGroup.LayoutParams.MATCH_PARENT,
        1f
      )
    }

    secondaryContainer = RelativeLayout(context).apply {
      layoutParams = LinearLayout.LayoutParams(
        0,
        ViewGroup.LayoutParams.MATCH_PARENT,
        1f
      )
    }

    primaryPlaceholder = createPlaceholderTextView(primaryPlaceholderText)
    secondaryPlaceholder = createPlaceholderTextView(secondaryPlaceholderText)

    primaryVideoView = VideoRendererView(context, appContext).apply {
      setVideoLayout("FILL")
      visibility = View.GONE
    }

    secondaryVideoView = VideoRendererView(context, appContext).apply {
      setVideoLayout("FILL")
      visibility = View.GONE
    }

    val primaryPlaceholderParams = RelativeLayout.LayoutParams(
      ViewGroup.LayoutParams.MATCH_PARENT,
      ViewGroup.LayoutParams.MATCH_PARENT
    )

    val primaryVideoParams = RelativeLayout.LayoutParams(
      ViewGroup.LayoutParams.MATCH_PARENT,
      ViewGroup.LayoutParams.MATCH_PARENT
    ).apply {
      addRule(RelativeLayout.CENTER_IN_PARENT)
    }

    val secondaryPlaceholderParams = RelativeLayout.LayoutParams(
      ViewGroup.LayoutParams.MATCH_PARENT,
      ViewGroup.LayoutParams.MATCH_PARENT
    )

    val secondaryVideoParams = RelativeLayout.LayoutParams(
      ViewGroup.LayoutParams.MATCH_PARENT,
      ViewGroup.LayoutParams.MATCH_PARENT
    ).apply {
      addRule(RelativeLayout.CENTER_IN_PARENT)
    }

    primaryContainer?.addView(primaryPlaceholder, primaryPlaceholderParams)
    primaryContainer?.addView(primaryVideoView, primaryVideoParams)
    secondaryContainer?.addView(secondaryPlaceholder, secondaryPlaceholderParams)
    secondaryContainer?.addView(secondaryVideoView, secondaryVideoParams)

    primaryContainer?.let { container.addView(it) }
    secondaryContainer?.let { container.addView(it) }

    return container
  }

  fun layoutForPiPEnter() {
    if (rootView == null) return
    isPipActive = true

    hideAllRootViewChildren(rootView)
    splitScreenContainer = createSplitScreenContainer()
    rootView.addView(splitScreenContainer)

    updatePipViews()
  }

  fun layoutForPiPExit() {
    if (rootView == null) return
    isPipActive = false

    splitScreenContainer?.let { container ->
      rootView.removeView(container)
    }

    cleanUpSplitScreenViews()
    restoreRootViewChildren(rootView)
  }

  private fun cleanUpSplitScreenViews() {
    primaryVideoView?.dispose()
    secondaryVideoView?.dispose()
    primaryVideoView = null
    secondaryVideoView = null
    primaryPlaceholder = null
    secondaryPlaceholder = null
    splitScreenContainer = null
    primaryContainer = null
    secondaryContainer = null
  }

  private fun hideAllRootViewChildren(rootView: ViewGroup) {
    for (i in 0 until rootView.childCount) {
      val child = rootView.getChildAt(i)
      rootViewChildrenOriginalVisibility.add(child.visibility)
      child.visibility = View.GONE
    }
  }

  private fun restoreRootViewChildren(rootView: ViewGroup) {
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

