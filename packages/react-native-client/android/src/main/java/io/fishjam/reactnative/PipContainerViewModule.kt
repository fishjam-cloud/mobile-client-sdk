package io.fishjam.reactnative

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PipContainerViewModule : Module() {
  override fun definition() =
    ModuleDefinition {
      Name("PipContainerViewModule")

      View(PipContainerView::class) {
        Prop("startAutomatically") { view: PipContainerView, value: Boolean ->
          view.startAutomatically = value
        }

        Prop("stopAutomatically") { view: PipContainerView, value: Boolean ->
          view.stopAutomatically = value
        }

        // iOS-only property, no-op on Android
        Prop("allowsCameraInBackground") { _: PipContainerView, _: Boolean ->
          // No-op on Android
        }

        Prop("primaryPlaceholderText") { view: PipContainerView, value: String ->
          view.primaryPlaceholderText = value
        }

        Prop("secondaryPlaceholderText") { view: PipContainerView, value: String ->
          view.secondaryPlaceholderText = value
        }

        AsyncFunction("startPictureInPicture") { view: PipContainerView ->
          view.startPictureInPicture()
        }

        AsyncFunction("stopPictureInPicture") { view: PipContainerView ->
          view.stopPictureInPicture()
        }
      }
    }
}

