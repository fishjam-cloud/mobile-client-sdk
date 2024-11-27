package com.fishjamcloud.client.webrtc

import com.fishjamcloud.client.models.Metadata
import fishjam.media_events.Shared
import fishjam.media_events.server.Server

internal interface RTCEngineListener {
  fun onConnected(
    endpointId: String,
    endpoints: Map<String, Server.MediaEvent.Endpoint>,
    iceServers: List<Server.MediaEvent.IceServer>
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

  fun onOfferData(tracksTypes: Server.MediaEvent.OfferData.TrackTypes)

  fun onSdpAnswer(
    sdp: String,
    midToTrackId: Map<String, String>
  )

  fun onRemoteCandidate(
    candidate: String,
    sdpMLineIndex: Int,
    sdpMid: String
  )

  fun onTracksAdded(
    endpointId: String,
    trackIdToTrack: Map<String, Server.MediaEvent.Track>
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

  fun onVadNotification(
    trackId: String,
    status: Server.MediaEvent.VadNotification.Status
  )

  fun onBandwidthEstimation(estimation: Long)
}
