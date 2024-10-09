package io.fishjam.reactnative

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class VideoRendererViewModule : Module() {
  override fun definition() =
    ModuleDefinition {
      Name("VideoRendererViewModule")

      View(VideoRendererView::class) {
        OnViewDestroys { view: VideoRendererView ->
          view.dispose()
          RNFishjamClient.trackUpdateListenersManager.remove(view)
          RNFishjamClient.localTracksSwitchListenerManager.remove(view)
        }

        Prop("trackId") { view: VideoRendererView, trackId: String ->
          view.init(trackId)
        }

        Prop("videoLayout") { view: VideoRendererView, videoLayout: String ->
          view.setVideoLayout(videoLayout)
        }

        Prop("alwaysRender") { view: VideoRendererView, alwaysRender: Boolean ->
          view.checkVisibilityDelayMillis = if (alwaysRender) null else 1000
        }
      }
    }
}
