package io.fishjam.reactnative

import android.app.PictureInPictureParams
import android.content.Context
import android.os.Build
import android.util.Log
import android.view.View
import android.view.ViewGroup
import androidx.annotation.RequiresApi
import androidx.fragment.app.FragmentActivity
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import io.fishjam.reactnative.helpers.PictureInPictureHelperFragment
import io.fishjam.reactnative.managers.TrackUpdateListener
import java.lang.ref.WeakReference

data class RemoteTrackInfo(
    val videoTrack: com.fishjamcloud.client.media.VideoTrack?,
    val displayName: String?,
    val videoTrackActive: Boolean
)

class PipContainerView(
    context: Context,
    appContext: AppContext
) : ExpoView(context, appContext), TrackUpdateListener {

    companion object {
        private const val TAG = "PipContainerView"
    }

    private val activityRef: WeakReference<FragmentActivity?> = WeakReference(
        appContext.currentActivity as? FragmentActivity
    )

    private val decorView = activityRef.get()?.window?.decorView
    private val rootView = decorView?.findViewById<ViewGroup>(android.R.id.content)
    private val rootViewChildrenOriginalVisibility: ArrayList<Int> = arrayListOf()

    private var pictureInPictureHelperTag: String? = null
    private var pipViews: PipViewContainer? = null
    private var isPipActive = false

    private val trackSelector = PipTrackSelector()
    private val viewFactory by lazy { PipViewFactory(context, appContext) }

    @RequiresApi(Build.VERSION_CODES.O)
    private val pictureInPictureParamsBuilder = PictureInPictureParams.Builder()

    var startAutomatically: Boolean = true
        set(value) {
            field = value
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                updateAutoEnterEnabled()
            }
        }

    var stopAutomatically: Boolean = true

    var primaryPlaceholderText: String = "No camera"
        set(value) {
            field = value
            pipViews?.primaryPlaceholder?.text = value
        }

    var secondaryPlaceholderText: String = "No active speaker"
        set(value) {
            field = value
            pipViews?.secondaryPlaceholder?.text = value
        }

    private var remoteTrackInfo: RemoteTrackInfo? = null

    @RequiresApi(Build.VERSION_CODES.O)
    private fun updatePictureInPictureParams() {
        val activity = activityRef.get()
        if (activity == null) {
            Log.w(TAG, "Cannot update PiP params: activity reference is null")
            return
        }

        try {
            activity.setPictureInPictureParams(pictureInPictureParamsBuilder.build())
        } catch (e: IllegalStateException) {
            Log.e(TAG, "Failed to update PiP params", e)
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

    private fun updatePipViews() {
        val views = pipViews ?: run {
            Log.w(TAG, "Cannot update PiP views: pipViews is null")
            return
        }

        val localCameraTrack = trackSelector.findLocalCameraTrack()
        updatePrimaryView(views, localCameraTrack)

        remoteTrackInfo = trackSelector.findSecondaryRemoteTrack(remoteTrackInfo)
        updateSecondaryView(views, remoteTrackInfo)
    }

    private fun updatePrimaryView(
        views: PipViewContainer,
        localCameraTrack: com.fishjamcloud.client.media.VideoTrack?
    ) {
        if (localCameraTrack != null && localCameraTrack.isEnabled()) {
            views.primaryVideoView.init(localCameraTrack.id())
            views.primaryVideoView.visibility = View.VISIBLE
            views.primaryPlaceholder.visibility = View.GONE
        } else {
            views.primaryVideoView.visibility = View.GONE
            views.primaryPlaceholder.visibility = View.VISIBLE
        }
    }

    private fun updateSecondaryView(
        views: PipViewContainer,
        trackInfo: RemoteTrackInfo?
    ) {
        trackInfo?.let { info ->
            if (info.videoTrackActive && info.videoTrack != null) {
                views.secondaryVideoView.init(info.videoTrack.id())
                views.secondaryVideoView.visibility = View.VISIBLE
                views.secondaryPlaceholder.visibility = View.GONE
                
                info.displayName?.let { displayName ->
                    views.secondaryNameOverlay.text = displayName
                    views.secondaryNameOverlay.visibility = View.VISIBLE
                } ?: run {
                    views.secondaryNameOverlay.visibility = View.GONE
                }
            } else {
                views.secondaryVideoView.visibility = View.GONE
                views.secondaryPlaceholder.text = info.displayName
                views.secondaryPlaceholder.visibility = View.VISIBLE
                views.secondaryNameOverlay.visibility = View.GONE
            }
        } ?: run {
            views.secondaryVideoView.visibility = View.GONE
            views.secondaryPlaceholder.text = secondaryPlaceholderText
            views.secondaryPlaceholder.visibility = View.VISIBLE
            views.secondaryNameOverlay.visibility = View.GONE
        }
        views.secondaryContainer.visibility = View.VISIBLE
    }

    @RequiresApi(Build.VERSION_CODES.O)
    fun startPictureInPicture() {
        val activity = activityRef.get()
        if (activity == null) {
            Log.w(TAG, "Cannot start PiP: activity reference is null")
            return
        }

        try {
            activity.enterPictureInPictureMode(pictureInPictureParamsBuilder.build())
        } catch (e: IllegalStateException) {
            Log.e(TAG, "Failed to enter PiP mode", e)
            emitPipNotSupportedWarning()
        }
    }

    fun stopPictureInPicture() {
        Log.d(TAG, "stopPictureInPicture called, but no-op on Android")
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()

        activityRef.get()?.let { activity ->
            val fragment = PictureInPictureHelperFragment(this)
            pictureInPictureHelperTag = fragment.id
            activity.supportFragmentManager.beginTransaction()
                .add(fragment, fragment.id)
                .commitAllowingStateLoss()
        } ?: Log.w(TAG, "Cannot attach PiP helper: activity reference is null")

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            updateAutoEnterEnabled()
        }

        RNFishjamClient.trackUpdateListenersManager.add(this)
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()

        activityRef.get()?.let { activity ->
            pictureInPictureHelperTag?.let { tag ->
                activity.supportFragmentManager.findFragmentByTag(tag)?.let { fragment ->
                    activity.supportFragmentManager.beginTransaction()
                        .remove(fragment)
                        .commitAllowingStateLoss()
                }
            }
        }

        startAutomatically = false
        RNFishjamClient.trackUpdateListenersManager.remove(this)
    }

    override fun onTracksUpdate() {
        if (isPipActive) {
            updatePipViews()
        }
    }

    fun layoutForPiPEnter() {
        val root = rootView
        if (root == null) {
            Log.w(TAG, "Cannot enter PiP layout: rootView is null")
            return
        }

        isPipActive = true

        hideAllRootViewChildren(root)
        pipViews = viewFactory.createPipViews(primaryPlaceholderText, secondaryPlaceholderText)
        pipViews?.let { views ->
            root.addView(views.splitScreenContainer)
        }

        updatePipViews()
    }

    fun layoutForPiPExit() {
        val root = rootView
        if (root == null) {
            Log.w(TAG, "Cannot exit PiP layout: rootView is null")
            return
        }

        isPipActive = false

        pipViews?.let { views ->
            root.removeView(views.splitScreenContainer)
            cleanUpViews(views)
        }
        pipViews = null

        restoreRootViewChildren(root)
    }

    private fun cleanUpViews(views: PipViewContainer) {
        views.primaryVideoView.dispose()
        views.secondaryVideoView.dispose()
    }

    private fun hideAllRootViewChildren(rootView: ViewGroup) {
        rootViewChildrenOriginalVisibility.clear()
        (0 until rootView.childCount).forEach { i ->
            val child = rootView.getChildAt(i)
            rootViewChildrenOriginalVisibility.add(child.visibility)
            child.visibility = View.GONE
        }
    }

    private fun restoreRootViewChildren(rootView: ViewGroup) {
        rootViewChildrenOriginalVisibility.forEachIndexed { index, originalVisibility ->
            if (index < rootView.childCount) {
                rootView.getChildAt(index).visibility = originalVisibility
            }
        }
        rootViewChildrenOriginalVisibility.clear()
    }
}

