package com.fishjamcloud.client.webrtc

import fishjam.media_events.Shared
import fishjam.media_events.server.Server
import com.fishjamcloud.client.models.Metadata

internal interface RTCEngineListener {
  fun onConnected(
    endpointID: String,
    otherEndpoints: List<Server.MediaEvent.Endpoint>
  )

  fun onSendMediaEvent(event: fishjam.media_events.peer.Peer.MediaEvent)

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
    tracksTypes: Server.MediaEvent.OfferData.TrackTypes
  )

  fun onSdpAnswer(
    sdpAnswer: String,
    midToTrackId: List<Shared.MidToTrackId>
  )

  fun onRemoteCandidate(
    candidate: String,
    sdpMLineIndex: Int,
    sdpMid: String
  )

  fun onTracksAdded(
    endpointId: String,
    tracks: List<Server.MediaEvent.Track>
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
    status: Server.MediaEvent.VadNotification.Status
  )

  fun onBandwidthEstimation(estimation: Long)
}
