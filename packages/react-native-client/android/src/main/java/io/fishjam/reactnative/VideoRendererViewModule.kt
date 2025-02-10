package io.fishjam.reactnative

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class VideoRendererViewModule : Module() {
  override fun definition() =
    ModuleDefinition {
      Name("VideoRendererViewModule")

      Events("TrackAspectRatioUpdated")

      View(VideoRendererView::class) {
        OnViewDestroys { view: VideoRendererView ->
          view.dispose()
          RNFishjamClient.trackUpdateListenersManager.remove(view)
          RNFishjamClient.localTracksSwitchListenerManager.remove(view)
        }

        Prop("trackId") { view, trackId: String ->
          view.init(trackId)
        }

        Prop("videoLayout") { view, videoLayout: String ->
          view.setVideoLayout(videoLayout)
        }

        Prop("skipRenderOutsideVisibleArea") { view, skipRenderOutsideVisibleArea: Boolean ->
          view.checkVisibilityDelayMillis = if (skipRenderOutsideVisibleArea) 1000 else null
        }
      }
    }
}
