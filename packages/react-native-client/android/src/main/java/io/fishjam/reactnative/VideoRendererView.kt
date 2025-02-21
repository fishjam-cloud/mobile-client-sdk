package io.fishjam.reactnative

import android.content.Context
import com.fishjamcloud.client.media.VideoTrack
import com.fishjamcloud.client.media.VideoTrackListener
import com.fishjamcloud.client.models.Dimensions
import expo.modules.kotlin.AppContext
import io.fishjam.reactnative.managers.TrackUpdateListener
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class VideoRendererView(
  context: Context,
  appContext: AppContext
) : VideoView(context, appContext),
  TrackUpdateListener,
  VideoTrackListener {
  private var activeVideoTrack: VideoTrack? = null
  private var trackId: String? = null

  init {
    RNFishjamClient.trackUpdateListenersManager.add(this)
  }

  private fun setupTrack(videoTrack: VideoTrack) {
    if (activeVideoTrack == videoTrack) return

    activeVideoTrack?.removeRenderer(videoView)
    activeVideoTrack = videoTrack

    videoTrack.setDimensionsListener(this)
    videoTrack.addRenderer(videoView)

    super.setupTrack()
  }

  private fun update() {
    CoroutineScope(Dispatchers.Main).launch {
      val peers = RNFishjamClient.getAllPeers()
      val endpoint = peers.firstOrNull { it.tracks[trackId] != null } ?: return@launch
      val videoTrack = endpoint.tracks[trackId] as? VideoTrack ?: return@launch
      setupTrack(videoTrack)
    }
  }

  fun init(trackId: String) {
    this.trackId = trackId
    update()
  }

  override fun dispose() {
    activeVideoTrack?.removeRenderer(videoView)
    RNFishjamClient.trackUpdateListenersManager.add(this)
    super.dispose()
  }

  override fun onTracksUpdate() {
    update()
  }

  override fun getVideoTrack(): VideoTrack? = activeVideoTrack

  override fun onDimensionsChanged(dimensions: Dimensions) {
    if (trackId == null) return

    RNFishjamClient.sendEvent(
      EmitableEvent.trackAspectRatioUpdated(
        trackId!!,
        dimensions.aspectRatio
      )
    )
  }
}
