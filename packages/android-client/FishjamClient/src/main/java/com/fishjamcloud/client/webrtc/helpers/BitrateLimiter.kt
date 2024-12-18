package com.fishjamcloud.client.webrtc.helpers

import com.fishjamcloud.client.models.TrackBandwidthLimit
import org.webrtc.RtpParameters
import kotlin.math.pow

class BitrateLimiter {
  companion object {
    fun calculateBitrates(
      encodings: List<RtpParameters.Encoding>,
      maxBitrate: TrackBandwidthLimit
    ): List<RtpParameters.Encoding> =
      when (maxBitrate) {
        is TrackBandwidthLimit.BandwidthLimit ->
          calculateUniformBitrates(encodings, maxBitrate.limit)
        is TrackBandwidthLimit.SimulcastBandwidthLimit ->
          calculateSimulcastBitrates(encodings, maxBitrate.limit)
      }

    private fun calculateSimulcastBitrates(
      encodings: List<RtpParameters.Encoding>,
      limits: Map<String, TrackBandwidthLimit.BandwidthLimit>
    ): List<RtpParameters.Encoding> =
      encodings.map { encoding ->
        val encodingLimit = limits[encoding.rid]?.limit ?: 0
        encoding.withBitrateInBps(encodingLimit)
      }

    private fun calculateUniformBitrates(
      encodings: List<RtpParameters.Encoding>,
      bitrate: Int
    ): List<RtpParameters.Encoding> {
      if (encodings.isEmpty()) return emptyList()
      if (bitrate == 0) {
        return encodings.map { it.withBitrateInBps(null) }
      }

      val k0 = encodings.minByOrNull { it.scaleResolutionDownBy ?: 1.0 }

      val bitrateParts =
        encodings.sumOf {
          ((k0?.scaleResolutionDownBy ?: 1.0) / (it.scaleResolutionDownBy ?: 1.0)).pow(2)
        }

      val x = bitrate / bitrateParts

      return encodings.map { encoding ->
        val calculatedBitrate =
          (x * ((k0?.scaleResolutionDownBy ?: 1.0) / (encoding.scaleResolutionDownBy ?: 1.0)).pow(2) * 1024).toInt()
        encoding.withBitrateInBps(calculatedBitrate)
      }
    }
  }
}

private fun RtpParameters.Encoding.withBitrateInBps(bps: Int?): RtpParameters.Encoding {
  val encoding =
    RtpParameters.Encoding(
      rid,
      active,
      scaleResolutionDownBy
    )
  encoding.maxBitrateBps = if (bps == 0) null else bps
  return encoding
}
