package io.fishjam.reactnative

import android.content.Context
import com.fishjamcloud.client.media.LocalVideoTrack
import com.fishjamcloud.client.media.VideoTrack
import expo.modules.kotlin.AppContext

class VideoPreviewView(
  context: Context,
  appContext: AppContext
) : VideoView(context, appContext),
  RNFishjamClient.OnLocalCameraTrackChangedListener {
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
    RNFishjamClient.localCameraTrackListeners.remove(this)
    super.onDetachedFromWindow()
    dispose()
  }

  override fun onAttachedToWindow() {
    RNFishjamClient.localCameraTrackListeners.add(this)
    super.onAttachedToWindow()
    initialize()
  }

  override fun getVideoTrack(): VideoTrack? = localVideoTrack

  override fun onLocalCameraTrackChanged() {
    if (localVideoTrack == null) trySetLocalCameraTrack()
  }
}
