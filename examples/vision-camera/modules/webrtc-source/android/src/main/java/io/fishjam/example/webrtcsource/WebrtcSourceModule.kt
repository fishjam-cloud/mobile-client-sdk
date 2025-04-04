package io.fishjam.example.webrtcsource

import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import io.fishjam.example.webrtcsource.webrtcframeprocessor.WebrtcFrameProcessorPlugin
import io.fishjam.reactnative.RNFishjamClient
import kotlinx.coroutines.runBlocking

class WebrtcSourceModule : Module() {
  // Packages needs to be initialized somewhere
  private val webrtcPlugin = WebrtcFrameProcessorPluginPackage()

  override fun definition() = ModuleDefinition {
    Name("WebrtcSource")

    OnDestroy {
      runBlocking {
        WebrtcFrameProcessorPlugin.currentSource?.let {
          RNFishjamClient.removeCustomSource(it)
        }
      }
    }

    AsyncFunction("createVisionCameraTrack") Coroutine { ->
      // Cleanup previous source if it wasn't removed for some reason
      WebrtcFrameProcessorPlugin.currentSource?.let {
        RNFishjamClient.removeCustomSource(it)
      }

      val source = WebrtcVisionCameraCustomSource()

      // Assign new source to the frame processor
      WebrtcFrameProcessorPlugin.currentSource = source

      // Create the source in fishjam (aka create track)
      RNFishjamClient.createCustomSource(source)
    }

    AsyncFunction("removeVisionCameraTrack") Coroutine { ->
      WebrtcFrameProcessorPlugin.currentSource?.let {
        RNFishjamClient.removeCustomSource(it)
      }
      WebrtcFrameProcessorPlugin.currentSource = null
    }
  }
}
