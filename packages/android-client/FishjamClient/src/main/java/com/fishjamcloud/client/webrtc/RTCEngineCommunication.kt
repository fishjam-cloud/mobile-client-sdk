package com.fishjamcloud.client.webrtc

import com.fishjamcloud.client.events.BandwidthEstimation
import com.fishjamcloud.client.events.Connect
import com.fishjamcloud.client.events.Connected
import com.fishjamcloud.client.events.Disconnect
import com.fishjamcloud.client.events.EncodingSwitched
import com.fishjamcloud.client.events.EndpointAdded
import com.fishjamcloud.client.events.EndpointRemoved
import com.fishjamcloud.client.events.EndpointUpdated
import com.fishjamcloud.client.events.LocalCandidate
import com.fishjamcloud.client.events.OfferData
import com.fishjamcloud.client.events.ReceivableEvent
import com.fishjamcloud.client.events.RemoteCandidate
import com.fishjamcloud.client.events.RenegotiateTracks
import com.fishjamcloud.client.events.SdpAnswer
import com.fishjamcloud.client.events.SdpOffer
import com.fishjamcloud.client.events.SelectEncoding
import com.fishjamcloud.client.events.SendableEvent
import com.fishjamcloud.client.events.TrackUpdated
import com.fishjamcloud.client.events.TracksAdded
import com.fishjamcloud.client.events.TracksRemoved
import com.fishjamcloud.client.events.UpdateEndpointMetadata
import com.fishjamcloud.client.events.UpdateTrackMetadata
import com.fishjamcloud.client.events.VadNotification
import com.fishjamcloud.client.events.gson
import com.fishjamcloud.client.events.serializeToMap
import com.fishjamcloud.client.models.EndpointType
import com.fishjamcloud.client.models.Metadata
import com.fishjamcloud.client.models.SerializedMediaEvent
import com.fishjamcloud.client.models.TrackEncoding
import com.google.gson.reflect.TypeToken
import timber.log.Timber
import kotlin.math.roundToLong

internal class RTCEngineCommunication {
  private val listeners = mutableListOf<RTCEngineListener>()

  fun addListener(listener: RTCEngineListener) {
    listeners.add(listener)
  }

  fun removeListener(listener: RTCEngineListener) {
    listeners.remove(listener)
  }

  fun connect(endpointMetadata: Metadata) {
    sendEvent(Connect(endpointMetadata))
  }

  fun updatePeerMetadata(endpointMetadata: Metadata) {
    sendEvent(UpdateEndpointMetadata(endpointMetadata))
  }

  fun updateTrackMetadata(
    trackId: String,
    trackMetadata: Metadata
  ) {
    sendEvent(UpdateTrackMetadata(trackId, trackMetadata))
  }

  fun setTargetTrackEncoding(
    trackId: String,
    encoding: TrackEncoding
  ) {
    sendEvent(
      SelectEncoding(
        trackId,
        encoding.rid
      )
    )
  }

  fun renegotiateTracks() {
    sendEvent(RenegotiateTracks())
  }

  fun localCandidate(
    sdp: String,
    sdpMLineIndex: Int
  ) {
    sendEvent(
      LocalCandidate(
        sdp,
        sdpMLineIndex
      )
    )
  }

  fun sdpOffer(
    sdp: String,
    trackIdToTrackMetadata: Map<String, Metadata?>,
    midToTrackId: Map<String, String>
  ) {
    sendEvent(
      SdpOffer(
        sdp,
        trackIdToTrackMetadata,
        midToTrackId
      )
    )
  }

  fun disconnect() {
    sendEvent(Disconnect())
  }

  private fun sendEvent(event: SendableEvent) {
    val serializedMediaEvent = gson.toJson(event.serializeToMap())
    listeners.forEach { listener -> listener.onSendMediaEvent(serializedMediaEvent) }
  }

  private fun decodeEvent(event: SerializedMediaEvent): ReceivableEvent? {
    val type = object : TypeToken<Map<String, Any?>>() {}.type

    val rawMessage: Map<String, Any?> = gson.fromJson(event, type)

    ReceivableEvent.decode(rawMessage)?.let {
      return it
    } ?: run {
      Timber.d("Failed to decode event $rawMessage")
      return null
    }
  }

  fun onEvent(serializedEvent: SerializedMediaEvent) {
    when (val event = decodeEvent(serializedEvent)) {
      is Connected ->
        listeners.forEach { listener ->
          listener.onConnected(
            event.data.id,
            event.data.otherEndpoints
          )
        }

      is OfferData ->
        listeners.forEach { listener ->
          listener.onOfferData(
            event.data.integratedTurnServers,
            event.data.tracksTypes
          )
        }

      is EndpointRemoved -> listeners.forEach { listener -> listener.onEndpointRemoved(event.data.id) }
      is EndpointAdded ->
        listeners.forEach { listener ->
          listener.onEndpointAdded(
            event.data.id,
            EndpointType.fromString(event.data.type),
            event.data.metadata
          )
        }

      is EndpointUpdated ->
        listeners.forEach { listener ->
          listener.onEndpointUpdated(
            event.data.id,
            event.data.metadata
          )
        }

      is RemoteCandidate ->
        listeners.forEach { listener ->
          listener.onRemoteCandidate(
            event.data.candidate,
            event.data.sdpMLineIndex,
            event.data.sdpMid
          )
        }

      is SdpAnswer ->
        listeners.forEach { listener ->
          listener.onSdpAnswer(
            event.data.type,
            event.data.sdp,
            event.data.midToTrackId
          )
        }

      is TrackUpdated ->
        listeners.forEach { listener ->
          listener.onTrackUpdated(
            event.data.endpointId,
            event.data.trackId,
            event.data.metadata
          )
        }

      is TracksAdded ->
        listeners.forEach { listener ->
          listener.onTracksAdded(
            event.data.endpointId,
            event.data.tracks
          )
        }

      is TracksRemoved ->
        listeners.forEach { listener ->
          listener.onTracksRemoved(
            event.data.endpointId,
            event.data.trackIds
          )
        }

      is EncodingSwitched ->
        listeners.forEach { listener ->
          listener.onTrackEncodingChanged(
            event.data.endpointId,
            event.data.trackId,
            event.data.encoding,
            event.data.reason
          )
        }

      is VadNotification ->
        listeners.forEach { listener ->
          listener.onVadNotification(
            event.data.trackId,
            event.data.status
          )
        }

      is BandwidthEstimation -> listeners.forEach { listener -> listener.onBandwidthEstimation(event.data.estimation.roundToLong()) }
      else -> Timber.e("Failed to process unknown event: $event")
    }
  }
}
