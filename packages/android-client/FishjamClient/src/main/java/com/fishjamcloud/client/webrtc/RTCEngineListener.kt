package com.fishjamcloud.client.webrtc

import com.fishjamcloud.client.events.Endpoint
import com.fishjamcloud.client.events.OfferData
import com.fishjamcloud.client.events.TrackData
import com.fishjamcloud.client.models.Metadata
import com.fishjamcloud.client.models.SerializedMediaEvent

internal interface RTCEngineListener {
  fun onConnected(
    endpointID: String,
    otherEndpoints: List<Endpoint>
  )

  fun onSendMediaEvent(event: SerializedMediaEvent)

  fun onEndpointAdded(
    endpointId: String,
    metadata: Metadata?
  )

  fun onEndpointRemoved(endpointId: String)

  fun onEndpointUpdated(
    endpointId: String,
    endpointMetadata: Metadata? = mapOf()
  )

  fun onOfferData(
    integratedTurnServers: List<OfferData.TurnServer>,
    tracksTypes: Map<String, Int>
  )

  fun onSdpAnswer(
    type: String,
    sdp: String,
    midToTrackId: Map<String, String>
  )

  fun onRemoteCandidate(
    candidate: String,
    sdpMLineIndex: Int,
    sdpMid: Int?
  )

  fun onTracksAdded(
    endpointId: String,
    tracks: Map<String, TrackData>
  )

  fun onTracksRemoved(
    endpointId: String,
    trackIds: List<String>
  )

  fun onTrackUpdated(
    endpointId: String,
    trackId: String,
    metadata: Metadata? = mapOf()
  )

  fun onTrackEncodingChanged(
    endpointId: String,
    trackId: String,
    encoding: String,
    encodingReason: String
  )

  fun onVadNotification(
    trackId: String,
    status: String
  )

  fun onBandwidthEstimation(estimation: Long)
}
