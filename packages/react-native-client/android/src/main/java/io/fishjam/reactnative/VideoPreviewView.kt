package io.fishjam.reactnative

import android.content.Context
import android.util.Log
import com.fishjamcloud.client.media.LocalVideoTrack
import com.fishjamcloud.client.models.Dimensions
import expo.modules.kotlin.AppContext
import io.fishjam.reactnative.managers.LocalCameraTrackChangedListener

class VideoPreviewView(
  context: Context,
  appContext: AppContext
) : VideoRendererView(context, appContext),
  LocalCameraTrackChangedListener {
  private fun trySetLocalCameraTrack() {
    (
      RNFishjamClient.fishjamClient.getLocalEndpoint().tracks.values.firstOrNull { track ->
        track is LocalVideoTrack
      } as? LocalVideoTrack?
    )?.let {
      init(it.id())
    }
  }

  override fun onDetachedFromWindow() {
    RNFishjamClient.localCameraTracksChangedListenersManager.remove(this)
    super.onDetachedFromWindow()
  }

  override fun onAttachedToWindow() {
    RNFishjamClient.localCameraTracksChangedListenersManager.add(this)
    activeVideoTrack?.removeRenderer(videoView)
    super.onAttachedToWindow()
    trySetLocalCameraTrack()
  }

  override fun onLocalCameraTrackChanged() {
    if (activeVideoTrack == null) trySetLocalCameraTrack()
  }
}
