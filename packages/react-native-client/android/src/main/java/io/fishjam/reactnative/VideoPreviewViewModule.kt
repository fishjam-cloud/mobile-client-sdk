package io.fishjam.reactnative

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class VideoPreviewViewModule : Module() {
  override fun definition() =
    ModuleDefinition {
      Name("VideoPreviewViewModule")

      View(VideoPreviewView::class) {
        OnViewDestroys { view: VideoPreviewView ->
          view.dispose()
          RNFishjamClient.localTracksSwitchListenerManager.remove(view)
        }

        Prop("videoLayout") { view: VideoPreviewView, videoLayout: String ->
          view.setVideoLayout(videoLayout)
        }
      }
    }
}
