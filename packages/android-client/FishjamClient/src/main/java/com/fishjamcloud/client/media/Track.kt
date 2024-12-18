package com.fishjamcloud.client.media

import com.fishjamcloud.client.models.Metadata
import org.webrtc.MediaStreamTrack
import org.webrtc.RtpParameters
import java.util.UUID

open class Track(
  internal val mediaTrack: MediaStreamTrack?,
  internal var sendEncodings: List<RtpParameters.Encoding> = emptyList(),
  val endpointId: String,
  private var rtcEngineId: String?,
  metadata: Metadata = mapOf(),
  /**
   * Every track can have 2 ids:
   * - the one from rtc engine in the form of <peerid>:<trackid>
   * - the one from webrtc library in the form of uuidv4 string (different than one from the engine)
   * It's always confusing when to use which one and we need to keep some kind of mapping.
   * What's worse a track might be sometimes missing one of the ids
   * - rtc engine id is missing when a local track is created without established connection
   * - webrtc id is missing when we get a track from rtc engine but is not yet negotiated
   * So we have a third id that is created by our client. It's always there, it's never changing
   * and we're always using it unless we talk to rtc engine or webrtc. The user sees just this id,
   * unless they want to debug something.
   */
  private val id: String = UUID.randomUUID().toString()
) {
  fun id(): String = id

  internal fun webrtcId(): String = mediaTrack?.id() ?: ""

  var metadata: Metadata = metadata
    internal set

  fun isEnabled(): Boolean = mediaTrack?.enabled() ?: false

  fun setEnabled(isEnabled: Boolean) {
    mediaTrack?.setEnabled(isEnabled)
  }

  internal fun setRTCEngineId(id: String) {
    rtcEngineId = id
  }

  internal fun getRTCEngineId(): String? = rtcEngineId
}
