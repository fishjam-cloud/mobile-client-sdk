import WebRTC

class StatsCollector {
    private let connection: RTCPeerConnection
    private(set) var peerConnectionStats: [String: RTCStats] = [:]

    init(connection: RTCPeerConnection) {
        self.connection = connection
        connection.statistics(completionHandler: { [weak self] RTCStatisticsReport in
            self?.extractRelevantStats(rp: RTCStatisticsReport)
        })
    }
    
    private func extractRelevantStats(rp: RTCStatisticsReport){
        rp.statistics.forEach { it1 in
            let it = it1.value
            if it.type == "outbound-rtp" {
                let duration = it.values["qualityLimitationDurations"] as? [String: Double]
                let qualityLimitation: QualityLimitationDurations = QualityLimitationDurations(
                    bandwidth: duration?["bandwidth"] ?? 0.0,
                    cpu: duration?["cpu"] ?? 0.0, none: duration?["none"] ?? 0.0, other: duration?["other"] ?? 0.0)
                
                peerConnectionStats[it.id as String] = RTCOutboundStats(
                    kind: it.values["kind"] as? String ?? "",
                    rid: it.values["rid"] as? String ?? "",
                    bytesSent: it.values["bytesSent"] as? UInt ?? 0,
                    targetBitrate: it.values["targetBitrate"] as? Double ?? 0.0,
                    packetsSent: it.values["packetsSent"] as? UInt ?? 0,
                    framesEncoded: it.values["framesEncoded"] as? UInt ?? 0,
                    framesPerSecond: it.values["framesPerSecond"] as? Double ?? 0.0,
                    frameWidth: it.values["frameWidth"] as? UInt ?? 0,
                    frameHeight: it.values["frameHeight"] as? UInt ?? 0,
                    qualityLimitationDurations: qualityLimitation
                )
            } else if it.type == "inbound-rtp" {
                peerConnectionStats[it.id as String] = RTCInboundStats(
                    kind: it.values["kind"] as? String ?? "",
                    jitter: it.values["jitter"] as? Double ?? 0.0,
                    packetsLost: it.values["packetsLost"] as? UInt ?? 0,
                    packetsReceived: it.values["packetsReceived"] as? UInt ?? 0,
                    bytesReceived: it.values["bytesReceived"] as? UInt ?? 0,
                    framesReceived: it.values["framesReceived"] as? UInt ?? 0,
                    frameWidth: it.values["frameWidth"] as? UInt ?? 0,
                    frameHeight: it.values["frameHeight"] as? UInt ?? 0,
                    framesPerSecond: it.values["framesPerSecond"] as? Double ?? 0.0,
                    framesDropped: it.values["framesDropped"] as? UInt ?? 0
                )
            }
        }
    }
}
