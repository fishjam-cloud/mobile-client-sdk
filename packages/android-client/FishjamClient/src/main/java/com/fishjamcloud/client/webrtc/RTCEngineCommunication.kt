package com.fishjamcloud.client.webrtc

import android.util.Log
import com.fishjamcloud.client.models.Metadata
import com.fishjamcloud.client.models.TrackEncoding
import com.fishjamcloud.client.utils.gson
import com.fishjamcloud.client.utils.serializeToMap
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
    val mediaEvent =
      fishjam.media_events.peer.Peer.MediaEvent
        .newBuilder()
        .setConnect(
          fishjam.media_events.peer.Peer.MediaEvent.Connect
            .newBuilder()
            .setMetadataJson(gson.toJson(endpointMetadata))
            .build()
        ).build()

    sendEvent(mediaEvent)
  }

  fun updatePeerMetadata(endpointMetadata: Metadata) {
    val mediaEvent =
      fishjam.media_events.peer.Peer.MediaEvent
        .newBuilder()
        .setUpdateEndpointMetadata(
          fishjam.media_events.peer.Peer.MediaEvent.UpdateEndpointMetadata
            .newBuilder()
            .setMetadataJson(gson.toJson(endpointMetadata))
            .build()
        ).build()

    sendEvent(mediaEvent)
  }

  fun updateTrackMetadata(
    trackId: String,
    trackMetadata: Metadata
  ) {
    val mediaEvent =
      fishjam.media_events.peer.Peer.MediaEvent
        .newBuilder()
        .setUpdateTrackMetadata(
          fishjam.media_events.peer.Peer.MediaEvent.UpdateTrackMetadata
            .newBuilder()
            .setTrackId(trackId)
            .setMetadataJson(gson.toJson(trackMetadata))
            .build()
        ).build()

    sendEvent(mediaEvent)
  }

  fun setTargetTrackEncoding(
    trackId: String,
    encoding: TrackEncoding
  ) {
    // TODO(FCE-953): This will be useful after simulcast is enabled
  }

  fun renegotiateTracks() {
    val mediaEvent =
      fishjam.media_events.peer.Peer.MediaEvent
        .newBuilder()
        .setRenegotiateTracks(
          fishjam.media_events.peer.Peer.MediaEvent.RenegotiateTracks
            .newBuilder()
            .build()
        ).build()

    sendEvent(mediaEvent)
  }

  fun localCandidate(
    sdp: String,
    sdpMLineIndex: Int,
    sdpMid: Int?,
    usernameFragment: String?
  ) {
    val mediaEvent =
      fishjam.media_events.peer.Peer.MediaEvent
        .newBuilder()
        .setCandidate(
          Shared.Candidate
            .newBuilder()
            .setCandidate(sdp)
            .setSdpMLineIndex(sdpMLineIndex)
            .apply {
              sdpMid?.let { setSdpMid(it.toString()) }
              usernameFragment?.let { setUsernameFragment(it) }
            }.build()
        ).build()

    sendEvent(mediaEvent)
  }

  fun sdpOffer(
    sdp: String,
    trackIdToTrackMetadata: Map<String, Metadata?>,
    midToTrackId: Map<String, String>,
    trackIdToBitrates: Map<String, Int>
  ) {
    val mediaEvent =
      fishjam.media_events.peer.Peer.MediaEvent
        .newBuilder()
        .setSdpOffer(
          fishjam.media_events.peer.Peer.MediaEvent.SdpOffer
            .newBuilder()
            .setSdp(sdp)
            .putAllMidToTrackId(midToTrackId)
            .putAllTrackIdToMetadataJson(
              trackIdToTrackMetadata.mapValues { (_, metadata) ->
                metadata?.let { gson.toJson(it) } ?: ""
              }
            ).putAllTrackIdToBitrates(
              trackIdToBitrates.mapValues { (trackId, bitrate) ->
                fishjam.media_events.peer.Peer.MediaEvent.TrackBitrates
                  .newBuilder()
                  .setTrackId(trackId)
                  .addVariantBitrates(
                    fishjam.media_events.peer.Peer.MediaEvent.VariantBitrate
                      .newBuilder()
                      .setVariant(fishjam.media_events.Shared.Variant.VARIANT_UNSPECIFIED) // TODO(FCE-953): Update with simulcast
                      .setBitrate(bitrate)
                      .build()
                  ).build()
              }
            ).build()
        ).build()

    sendEvent(mediaEvent)
  }

  fun disconnect() {
    val mediaEvent =
      fishjam.media_events.peer.Peer.MediaEvent
        .newBuilder()
        .setDisconnect(
          fishjam.media_events.peer.Peer.MediaEvent.Disconnect
            .newBuilder()
            .build()
        ).build()

    sendEvent(mediaEvent)
  }

  private fun sendEvent(event: fishjam.media_events.peer.Peer.MediaEvent) {
    listeners.forEach { listener -> listener.onSendMediaEvent(event) }
  }

  fun onEvent(event: fishjam.media_events.server.Server.MediaEvent) {
    Log.i("IncomingEvent", event.toString())

    when {
      event.hasConnected() ->
        listeners.forEach { listener ->
          listener.onConnected(
            event.connected.endpointId,
            event.connected.endpointIdToEndpointMap,
            event.connected.iceServersList
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
            event.endpointAdded.metadataJson.serializeToMap()
          )
        }

      event.hasEndpointUpdated() ->
        listeners.forEach { listener ->
          listener.onEndpointUpdated(
            event.endpointUpdated.endpointId,
            event.endpointUpdated.metadataJson.serializeToMap()
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
            event.sdpAnswer.sdp,
            event.sdpAnswer.midToTrackIdMap
          )
        }

      event.hasTrackUpdated() ->
        listeners.forEach { listener ->
          listener.onTrackUpdated(
            event.trackUpdated.endpointId,
            event.trackUpdated.trackId,
            event.trackUpdated.metadataJson.serializeToMap()
          )
        }

      event.hasTracksAdded() ->
        listeners.forEach { listener ->
          listener.onTracksAdded(
            event.tracksAdded.endpointId,
            event.tracksAdded.trackIdToTrackMap
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

      event.hasTrackVariantSwitched() -> {} // TODO(FCE-953): Add with simulcast
      event.hasTrackVariantDisabled() -> {} // TODO(FCE-953): Add with simulcast
      event.hasTrackVariantEnabled() -> {} // TODO(FCE-953): Add with simulcast

      else -> Timber.e("Failed to process unknown event: $event")
    }
  }
}
