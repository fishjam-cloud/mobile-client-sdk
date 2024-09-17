package io.fishjam.reactnative

import android.content.Context
import com.fishjamcloud.client.media.LocalVideoTrack
import com.fishjamcloud.client.media.VideoTrack
import expo.modules.kotlin.AppContext

class VideoPreviewView(
  context: Context,
  appContext: AppContext
) : VideoView(context, appContext) {
  private var localVideoTrack: LocalVideoTrack? = null

  private fun initialize() {
    localVideoTrack =
      RNFishjamClient.fishjamClient.getLocalEndpoint().tracks.values.firstOrNull { track ->
        track is LocalVideoTrack
      } as? LocalVideoTrack?

    videoView.let { localVideoTrack?.addRenderer(it) }
    super.setupTrack()
  }

  override fun dispose() {
    videoView.let { localVideoTrack?.removeRenderer(it) }
    super.dispose()
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    dispose()
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    initialize()
  }

  override fun getVideoTrack(): VideoTrack? = localVideoTrack
}
