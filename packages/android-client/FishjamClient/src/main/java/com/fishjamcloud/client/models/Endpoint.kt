package com.fishjamcloud.client.models

import com.fishjamcloud.client.media.Track

data class Endpoint(
  val id: String,
  val metadata: Metadata? = mapOf(),
  val tracks: Map<String, Track> = mapOf()
) {
  internal fun addOrReplaceTrack(track: Track): Endpoint {
    val tracks = tracks.toMutableMap()
    tracks[track.id()] = track
    return this.copy(tracks = tracks)
  }

  internal fun removeTrack(trackId: String): Endpoint {
    val tracks = tracks.toMutableMap()
    tracks.remove(trackId)
    return this.copy(tracks = tracks)
  }
}

typealias Peer = Endpoint
