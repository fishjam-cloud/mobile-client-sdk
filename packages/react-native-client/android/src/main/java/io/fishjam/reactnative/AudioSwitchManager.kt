package io.fishjam.reactnative

import android.content.Context
import android.os.Handler
import android.os.Looper
import com.twilio.audioswitch.AudioDevice
import com.twilio.audioswitch.AudioDeviceChangeListener
import com.twilio.audioswitch.AudioSwitch

class AudioSwitchManager(
  private val context: Context
) {
  private var preferredDeviceList =
    listOf(
      AudioDevice.BluetoothHeadset::class.java,
      AudioDevice.WiredHeadset::class.java,
      AudioDevice.Speakerphone::class.java,
      AudioDevice.Earpiece::class.java
    )

  // AudioSwitch is not threadsafe, so all calls should be done on the main thread.
  private val handler: Handler = Handler(Looper.getMainLooper())

  private var audioSwitch: AudioSwitch =
    AudioSwitch(context, loggingEnabled = true, preferredDeviceList = preferredDeviceList)

  fun start(listener: AudioDeviceChangeListener) {
    handler.removeCallbacksAndMessages(null)
    handler.postAtFrontOfQueue {
      audioSwitch.start(listener)
      audioSwitch.activate()
    }
  }

  fun stop() {
    handler.removeCallbacksAndMessages(null)
    handler.postAtFrontOfQueue {
      audioSwitch.stop()
    }
  }

  fun selectedAudioDevice(): AudioDevice? = audioSwitch.selectedAudioDevice

  fun availableAudioDevices(): List<AudioDevice> = audioSwitch.availableAudioDevices

  fun selectAudioOutput(audioDeviceClass: Class<out AudioDevice?>) {
    handler.post {
      availableAudioDevices()
        .find { it.javaClass == audioDeviceClass }
        ?.let {
          audioSwitch.selectDevice(it)
        }
    }
  }

  fun selectAudioOutput(kind: AudioDeviceKind?) {
    if (kind != null) {
      selectAudioOutput(kind.audioDeviceClass)
    }
  }
}
