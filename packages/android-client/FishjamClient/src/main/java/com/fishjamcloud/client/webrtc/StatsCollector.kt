package com.fishjamcloud.client.webrtc

import com.fishjamcloud.client.models.QualityLimitationDurations
import com.fishjamcloud.client.models.RTCInboundStats
import com.fishjamcloud.client.models.RTCOutboundStats
import com.fishjamcloud.client.models.RTCStats
import org.webrtc.PeerConnection
import org.webrtc.RTCStatsReport
import java.math.BigInteger
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

class StatsCollector {
  companion object {
    suspend fun getStats(connection: PeerConnection): Map<String, RTCStats> =
      suspendCoroutine { continuation ->
        connection.getStats { report ->
          continuation.resume(extractRelevantStats(report))
        }
      }

    private fun extractRelevantStats(report: RTCStatsReport): Map<String, RTCStats> =
      report.statsMap.values
        .mapNotNull { stats ->
          when (stats.type) {
            "outbound-rtp" -> stats.id to extractOutboundStats(stats)
            "inbound-rtp" -> stats.id to extractInboundStats(stats)
            else -> null
          }
        }.toMap()

    private fun extractOutboundStats(stats: org.webrtc.RTCStats): RTCOutboundStats {
      val durations = stats.members["qualityLimitationDurations"] as? Map<*, *>
      val qualityLimitation =
        QualityLimitationDurations(
          durations?.get("bandwidth") as? Double ?: 0.0,
          durations?.get("cpu") as? Double ?: 0.0,
          durations?.get("none") as? Double ?: 0.0,
          durations?.get("other") as? Double ?: 0.0
        )

      return RTCOutboundStats(
        kind = stats.members["kind"] as? String,
        rid = stats.members["rid"] as? String,
        bytesSent = stats.members["bytesSent"] as? BigInteger,
        targetBitrate = stats.members["targetBitrate"] as? Double,
        packetsSent = stats.members["packetsSent"] as? Long,
        framesEncoded = stats.members["framesEncoded"] as? Long,
        framesPerSecond = stats.members["framesPerSecond"] as? Double,
        frameWidth = stats.members["frameWidth"] as? Long,
        frameHeight = stats.members["frameHeight"] as? Long,
        qualityLimitationDurations = qualityLimitation
      )
    }

    private fun extractInboundStats(stats: org.webrtc.RTCStats): RTCInboundStats =
      RTCInboundStats(
        kind = stats.members["kind"] as? String,
        jitter = stats.members["jitter"] as? Double,
        packetsLost = stats.members["packetsLost"] as? Int,
        packetsReceived = stats.members["packetsReceived"] as? Long,
        bytesReceived = stats.members["bytesReceived"] as? BigInteger,
        framesReceived = stats.members["framesReceived"] as? Int,
        frameWidth = stats.members["frameWidth"] as? Long,
        frameHeight = stats.members["frameHeight"] as? Long,
        framesPerSecond = stats.members["framesPerSecond"] as? Double,
        framesDropped = stats.members["framesDropped"] as? Long
      )
  }
}
