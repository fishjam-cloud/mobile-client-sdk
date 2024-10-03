package io.fishjam.reactnative

import android.content.Context
import com.fishjamcloud.client.media.LocalVideoTrack
import com.fishjamcloud.client.media.VideoTrack
import expo.modules.kotlin.AppContext
import io.fishjam.reactnative.managers.LocalCameraTrackChangedListener

class VideoPreviewView(
  context: Context,
  appContext: AppContext
) : VideoView(context, appContext),
  LocalCameraTrackChangedListener {
  private var localVideoTrack: LocalVideoTrack? = null

  private fun trySetLocalCameraTrack() {
    localVideoTrack =
      RNFishjamClient.fishjamClient.getLocalEndpoint().tracks.values.firstOrNull { track ->
        track is LocalVideoTrack
      } as? LocalVideoTrack?
    videoView.let { localVideoTrack?.addRenderer(it) }
  }

  private fun initialize() {
    trySetLocalCameraTrack()
    super.setupTrack()
  }

  override fun dispose() {
    videoView.let { localVideoTrack?.removeRenderer(it) }
    super.dispose()
  }

  override fun onDetachedFromWindow() {
    RNFishjamClient.localCameraTracksChangedListenersManager.remove(this)
    super.onDetachedFromWindow()
    dispose()
  }

  override fun onAttachedToWindow() {
    RNFishjamClient.localCameraTracksChangedListenersManager.add(this)
    super.onAttachedToWindow()
    initialize()
  }

  override fun getVideoTrack(): VideoTrack? = localVideoTrack

  override fun onLocalCameraTrackChanged() {
    if (localVideoTrack == null) trySetLocalCameraTrack()
  }
}
