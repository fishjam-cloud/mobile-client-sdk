package com.fishjamcloud.client.webrtc

import com.fishjamcloud.client.events.Connect
import com.fishjamcloud.client.events.Disconnect
import com.fishjamcloud.client.events.LocalCandidate
import com.fishjamcloud.client.events.ReceivableEvent
import com.fishjamcloud.client.events.RenegotiateTracks
import com.fishjamcloud.client.events.SdpOffer
import com.fishjamcloud.client.events.SelectEncoding
import com.fishjamcloud.client.events.SendableEvent
import com.fishjamcloud.client.events.UpdateEndpointMetadata
import com.fishjamcloud.client.events.UpdateTrackMetadata
import com.fishjamcloud.client.events.gson
import com.fishjamcloud.client.events.serializeToMap
import com.fishjamcloud.client.models.Metadata
import com.fishjamcloud.client.models.SerializedMediaEvent
import com.fishjamcloud.client.models.TrackEncoding
import com.google.gson.reflect.TypeToken
import fishjam.media_events.Shared
import timber.log.Timber

internal class RTCEngineCommunication {
  private val listeners = mutableListOf<RTCEngineListener>()

  fun addListener(listener: RTCEngineListener) {
    listeners.add(listener)
  }

  fun removeListener(listener: RTCEngineListener) {
    listeners.remove(listener)
  }

  fun connect(endpointMetadata: Metadata) {
    val mediaEvent = fishjam.media_events.peer.Peer.MediaEvent.newBuilder()
      .setConnect(
        fishjam.media_events.peer.Peer.MediaEvent.Connect.newBuilder()
          .setMetadata(
            Shared.Metadata.newBuilder()
              .setJson(gson.toJson(endpointMetadata).toString())
              .build()
          )
          .build()
      )
      .build()



    sendEvent(mediaEvent)
  }

  fun updatePeerMetadata(endpointMetadata: Metadata) {
    val mediaEvent = fishjam.media_events.peer.Peer.MediaEvent.newBuilder()
      .setUpdateEndpointMetadata(
        fishjam.media_events.peer.Peer.MediaEvent.UpdateEndpointMetadata.newBuilder()
          .setMetadata(
            Shared.Metadata.newBuilder()
              .setJson(gson.toJson(endpointMetadata))
              .build()
          )
          .build()
      )
      .build()

    sendEvent(mediaEvent)
  }

  fun updateTrackMetadata(
    trackId: String,
    trackMetadata: Metadata
  ) {
    val mediaEvent = fishjam.media_events.peer.Peer.MediaEvent.newBuilder()
      .setUpdateTrackMetadata(
        fishjam.media_events.peer.Peer.MediaEvent.UpdateTrackMetadata.newBuilder()
          .setTrackId(trackId)
          .setMetadata(
            Shared.Metadata.newBuilder()
              .setJson(gson.toJson(trackMetadata))
              .build()
          )
          .build()
      )
      .build()

    sendEvent(mediaEvent)
  }

  fun setTargetTrackEncoding(
    trackId: String,
    encoding: TrackEncoding
  ) {
//    val mediaEvent = fishjam.media_events.peer.Peer.MediaEvent.newBuilder()
//      .sett(
//        fishjam.media_events.peer.Peer.MediaEvent.SelectEncoding.newBuilder()
//          .setTrackId(trackId)
//          .setRid(encoding.rid)
//          .build()
//      )
//      .build()
//
//    sendEvent(mediaEvent)
  }

  fun renegotiateTracks() {
    val mediaEvent = fishjam.media_events.peer.Peer.MediaEvent.newBuilder()
      .setRenegotiateTracks(
        fishjam.media_events.peer.Peer.MediaEvent.RenegotiateTracks.newBuilder()
          .build()
      )
      .build()

    sendEvent(mediaEvent)
  }

  fun localCandidate(
    sdp: String,
    sdpMLineIndex: Int,
    sdpMid: Int?,
    usernameFragment: String?
  ) {
    val mediaEvent = fishjam.media_events.peer.Peer.MediaEvent.newBuilder()
      .setCandidate(
        Shared.Candidate.newBuilder()
          .setCandidate(sdp)
          .setSdpMLineIndex(sdpMLineIndex)
          .apply {
            sdpMid?.let { setSdpMid(it.toString()) }
            usernameFragment?.let { setUsernameFragment(it) }
          }
          .build()
      )
      .build()

    sendEvent(mediaEvent)
  }

  fun sdpOffer(
    sdp: String,
    trackIdToTrackMetadata: Map<String, Metadata?>,
    midToTrackId: Map<String, String>
  ) {
    val mediaEvent = fishjam.media_events.peer.Peer.MediaEvent.newBuilder()
      .setSdpOffer(
        fishjam.media_events.peer.Peer.MediaEvent.SdpOffer.newBuilder()
          .setSdpOffer(gson.toJson(mapOf("type" to "offer", "sdp" to sdp)))
          .addAllTrackIdToMetadata(
            trackIdToTrackMetadata.map { (trackId, metadata) ->
              fishjam.media_events.peer.Peer.MediaEvent.TrackIdToMetadata.newBuilder()
                .setTrackId(trackId)
                .apply {
                  metadata?.let {
                    setMetadata(
                      Shared.Metadata.newBuilder()
                        .setJson(gson.toJson(it))
                        .build()
                    )
                  }
                }
                .build()
            }
          )
          .addAllMidToTrackId(
            midToTrackId.map { (mid, trackId) ->
              Shared.MidToTrackId.newBuilder()
                .setMid(mid)
                .setTrackId(trackId)
                .build()
            }
          )
          .build()
      )
      .build()

    sendEvent(mediaEvent)
  }

  fun disconnect() {
    val mediaEvent = fishjam.media_events.peer.Peer.MediaEvent.newBuilder()
      .setDisconnect(
        fishjam.media_events.peer.Peer.MediaEvent.Disconnect.newBuilder()
          .build()
      )
      .build()

    sendEvent(mediaEvent)
  }

  private fun sendEvent(event: fishjam.media_events.peer.Peer.MediaEvent) {
    listeners.forEach { listener -> listener.onSendMediaEvent(event) }
  }

  fun onEvent(event: fishjam.media_events.server.Server.MediaEvent) {
    when {
      event.hasConnected() ->
        listeners.forEach { listener ->
          listener.onConnected(
            event.connected.endpointId,
            event.connected.endpointsList
          )
        }

      event.hasOfferData() ->
        listeners.forEach { listener ->
          listener.onOfferData(
            event.offerData.tracksTypes
          )
        }

      event.hasEndpointRemoved() ->
        listeners.forEach { listener ->
          listener.onEndpointRemoved(event.endpointRemoved.endpointId)
        }

      event.hasEndpointAdded() ->
        listeners.forEach { listener ->
          listener.onEndpointAdded(
            event.endpointAdded.endpointId,
            event.endpointAdded.metadata.serializeToMap()
          )
        }

      event.hasEndpointUpdated() ->
        listeners.forEach { listener ->
          listener.onEndpointUpdated(
            event.endpointUpdated.endpointId,
            event.endpointUpdated.metadata.serializeToMap()
          )
        }

      event.hasCandidate() ->
        listeners.forEach { listener ->
          listener.onRemoteCandidate(
            event.candidate.candidate,
            event.candidate.sdpMLineIndex,
            event.candidate.sdpMid
          )
        }

      event.hasSdpAnswer() ->
        listeners.forEach { listener ->
          listener.onSdpAnswer(
            event.sdpAnswer.sdpAnswer,
            event.sdpAnswer.midToTrackIdList
          )
        }

      event.hasTrackUpdated() ->
        listeners.forEach { listener ->
          listener.onTrackUpdated(
            event.trackUpdated.endpointId,
            event.trackUpdated.trackId,
            event.trackUpdated.metadata.serializeToMap()
          )
        }

      event.hasTracksAdded() ->
        listeners.forEach { listener ->
          listener.onTracksAdded(
            event.tracksAdded.endpointId,
            event.tracksAdded.tracksList
          )
        }

      event.hasTracksRemoved() ->
        listeners.forEach { listener ->
          listener.onTracksRemoved(
            event.tracksRemoved.endpointId,
            event.tracksRemoved.trackIdsList
          )
        }

      event.hasVadNotification() ->
        listeners.forEach { listener ->
          listener.onVadNotification(
            event.vadNotification.trackId,
            event.vadNotification.status
          )
        }

      else -> Timber.e("Failed to process unknown event: $event")
    }
  }
}
