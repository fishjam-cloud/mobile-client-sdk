package com.fishjamcloud.client.media

import android.media.projection.MediaProjection
import com.fishjamcloud.client.models.Metadata
import com.fishjamcloud.client.models.VideoParameters
import com.fishjamcloud.client.utils.ClosableCoroutineScope
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import org.webrtc.ScreenCapturerAndroid
import org.webrtc.VideoSource
import java.util.ArrayList

class LocalScreencastTrack(
  videoTrack: org.webrtc.VideoTrack,
  endpointId: String,
  metadata: Metadata,
  internal val capturer: ScreenCapturerAndroid,
  val videoParameters: VideoParameters,
  internal val videoSource: VideoSource
) : VideoTrack(videoTrack, endpointId, null, metadata),
  LocalTrack {
  constructor(
    videoTrack: org.webrtc.VideoTrack,
    oldTrack: LocalScreencastTrack
  ) : this(videoTrack, oldTrack.endpointId, oldTrack.metadata, oldTrack.capturer, oldTrack.videoParameters, oldTrack.videoSource)

  private val mutex = Mutex()
  private val coroutineScope: CoroutineScope =
    ClosableCoroutineScope(SupervisorJob())
  private var isStopped = false

  override fun start() {
    coroutineScope.launch {
      mutex.withLock {
        if (!isStopped) {
          capturer.startCapture(
            videoParameters.dimensions.width,
            videoParameters.dimensions.height,
            videoParameters.maxFps
          )
        }
      }
    }
  }

  override fun stop() {
    coroutineScope.launch {
      mutex.withLock {
        isStopped = true
        capturer.stopCapture()
        capturer.dispose()
        videoTrack.dispose()
      }
    }
  }

  /*
      MediaProjection callback wrapper holding several callbacks that
      will be invoked once the media projections stops.
   */
  class ProjectionCallback : MediaProjection.Callback() {
    var callbacks: ArrayList<() -> Unit> = arrayListOf()

    override fun onStop() {
      callbacks.forEach {
        it.invoke()
      }

      callbacks.clear()
    }

    fun addCallback(callback: () -> Unit) {
      callbacks.add(callback)
    }
  }
}
