package com.fishjamcloud.client.webrtc.helpers

import com.fishjamcloud.client.models.TrackBandwidthLimit
import org.webrtc.RtpParameters
import kotlin.math.pow

class BitrateLimiter {
  companion object {
    fun calculateBitrates(
      encodings: List<RtpParameters.Encoding>,
      maxBitrate: TrackBandwidthLimit
    ): List<RtpParameters.Encoding> {
      return when (maxBitrate) {
        is TrackBandwidthLimit.BandwidthLimit ->
          calculateUniformBitrates(encodings, maxBitrate.limit)
        is TrackBandwidthLimit.SimulcastBandwidthLimit ->
          calculateSimulcastBitrates(encodings, maxBitrate.limit)
      }
    }

    private fun calculateSimulcastBitrates(
      encodings: List<RtpParameters.Encoding>,
      limits: Map<String, TrackBandwidthLimit.BandwidthLimit>
    ): List<RtpParameters.Encoding> {
      return encodings.map { encoding ->
        val encodingLimit = limits[encoding.rid]?.limit ?: 0
        encoding.withBitrate(encodingLimit)
      }
    }

    private fun calculateUniformBitrates(
      encodings: List<RtpParameters.Encoding>,
      bitrate: Int
    ): List<RtpParameters.Encoding> {
      if (encodings.isEmpty()) return emptyList()
      if (bitrate == 0) {
        return encodings.map { it.withBitrate(null) }
      }

      // Find minimum scale resolution
      val k0 = encodings.minOfOrNull { it.scaleResolutionDownBy ?: 1.0 } ?: 1.0

      val bitrateParts = encodings.sumOf { encoding ->
        (k0 / (encoding.scaleResolutionDownBy ?: 1.0)).pow(2)
      }

      val multiplier = bitrate.toDouble() / bitrateParts

      return encodings.map { encoding ->
        val calculatedBitrate = (multiplier *
          (k0 / (encoding.scaleResolutionDownBy ?: 1.0)).pow(2)).toInt()
        encoding.withBitrate(calculatedBitrate)
      }
    }
  }
}

private fun RtpParameters.Encoding.withBitrate(kbps: Int?): RtpParameters.Encoding {
  val encoding = RtpParameters.Encoding(
    rid,
    active,
    scaleResolutionDownBy
  )
  encoding.maxBitrateBps = if (kbps == 0) null else kbps?.times(1024)
  return encoding
}
