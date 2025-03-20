import WebRTC

class StatsCollector {
    static func getStats(for connection: RTCPeerConnection) async -> [String: RTCStats] {
        let report = await connection.statistics()
        return extractRelevantStats(rp: report)
    }

    private static func extractRelevantStats(rp: RTCStatisticsReport) -> [String: RTCStats] {
        return rp.statistics.reduce(into: [:]) { stats, pair in
            let stat = pair.value
            switch stat.type {
            case "outbound-rtp": stats[stat.id as String] = extractOutboundStats(from: stat)
            case "inbound-rtp": stats[stat.id as String] = extractInboundStats(from: stat)
            default: break
            }
        }
    }

    private static func extractOutboundStats(from stats: RTCStatistics) -> RTCOutboundStats {
        let duration = stats.values["qualityLimitationDurations"] as? [String: Double]
        let qualityLimitation = QualityLimitationDurations(
            bandwidth: duration?["bandwidth"] ?? 0.0,
            cpu: duration?["cpu"] ?? 0.0,
            none: duration?["none"] ?? 0.0,
            other: duration?["other"] ?? 0.0
        )

        return RTCOutboundStats(
            kind: stats.values["kind"] as? String ?? "",
            rid: stats.values["rid"] as? String ?? "",
            bytesSent: stats.values["bytesSent"] as? UInt ?? 0,
            targetBitrate: stats.values["targetBitrate"] as? Double ?? 0.0,
            packetsSent: stats.values["packetsSent"] as? UInt ?? 0,
            framesEncoded: stats.values["framesEncoded"] as? UInt ?? 0,
            framesPerSecond: stats.values["framesPerSecond"] as? Double ?? 0.0,
            frameWidth: stats.values["frameWidth"] as? UInt ?? 0,
            frameHeight: stats.values["frameHeight"] as? UInt ?? 0,
            qualityLimitationDurations: qualityLimitation
        )
    }

    private static func extractInboundStats(from stats: RTCStatistics) -> RTCInboundStats {
        return RTCInboundStats(
            kind: stats.values["kind"] as? String ?? "",
            jitter: stats.values["jitter"] as? Double ?? 0.0,
            packetsLost: stats.values["packetsLost"] as? UInt ?? 0,
            packetsReceived: stats.values["packetsReceived"] as? UInt ?? 0,
            bytesReceived: stats.values["bytesReceived"] as? UInt ?? 0,
            framesReceived: stats.values["framesReceived"] as? UInt ?? 0,
            frameWidth: stats.values["frameWidth"] as? UInt ?? 0,
            frameHeight: stats.values["frameHeight"] as? UInt ?? 0,
            framesPerSecond: stats.values["framesPerSecond"] as? Double ?? 0.0,
            framesDropped: stats.values["framesDropped"] as? UInt ?? 0
        )
    }
}
