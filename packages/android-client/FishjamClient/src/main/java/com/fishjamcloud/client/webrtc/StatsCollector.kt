package com.fishjamcloud.client.webrtc

import org.webrtc.PeerConnection
import org.webrtc.RTCStatsReport
import com.fishjamcloud.client.models.RTCStats
import com.fishjamcloud.client.models.RTCOutboundStats
import com.fishjamcloud.client.models.RTCInboundStats
import com.fishjamcloud.client.models.QualityLimitationDurations
import java.math.BigInteger
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

class StatsCollector {
  companion object {
    suspend fun getStats(connection: PeerConnection): Map<String, RTCStats> = suspendCoroutine { continuation ->
      connection.getStats { report ->
        val extractedStats = extractRelevantStats(report)

        continuation.resume(extractedStats)
      }
    }

    private fun extractRelevantStats(report: RTCStatsReport): Map<String, RTCStats> {
      val peerConnectionStats = mutableMapOf<String, RTCStats>()

      report.statsMap.values.forEach { stats ->
        when (stats.type) {
          "outbound-rtp" -> {
            val durations = stats.members["qualityLimitationDurations"] as? Map<*, *>
            val qualityLimitation = QualityLimitationDurations(
              durations?.get("bandwidth") as? Double ?: 0.0,
              durations?.get("cpu") as? Double ?: 0.0,
              durations?.get("none") as? Double ?: 0.0,
              durations?.get("other") as? Double ?: 0.0
            )

            peerConnectionStats[stats.id] = RTCOutboundStats(
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
          "inbound-rtp" -> {
            peerConnectionStats[stats.id] = RTCInboundStats(
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
      }

      return peerConnectionStats
    }
  }
}
