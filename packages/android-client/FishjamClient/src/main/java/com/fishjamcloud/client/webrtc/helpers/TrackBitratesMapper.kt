package com.fishjamcloud.client.webrtc.helpers

import com.fishjamcloud.client.media.Track
import fishjam.media_events.Shared
import fishjam.media_events.peer.Peer

class TrackBitratesMapper {
  companion object {
    fun mapTracksToProtoBitrates(localTracks: Map<String, Track>): Map<String, Peer.MediaEvent.TrackBitrates> =
      localTracks.values.associate { track ->
        track.webrtcId() to
          Peer.MediaEvent.TrackBitrates
            .newBuilder()
            .setTrackId(track.webrtcId())
            .addAllVariantBitrates(
              track.sendEncodings.map { encoding ->
                val variant =
                  when (encoding.rid) {
                    "h" -> Shared.Variant.VARIANT_HIGH
                    "m" -> Shared.Variant.VARIANT_MEDIUM
                    "l" -> Shared.Variant.VARIANT_LOW
                    else -> Shared.Variant.VARIANT_UNSPECIFIED
                  }

                Peer.MediaEvent.VariantBitrate
                  .newBuilder()
                  .setVariant(variant)
                  .setBitrate(encoding.maxBitrateBps ?: 0)
                  .build()
              }
            ).build()
      }
  }
}
