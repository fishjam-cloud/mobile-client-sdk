public struct QualityLimitationDurations {
    public let bandwidth: Double
    public let cpu: Double
    public let none: Double
    public let other: Double

    public init(bandwidth: Double, cpu: Double, none: Double, other: Double) {
        self.bandwidth = bandwidth
        self.cpu = cpu
        self.none = none
        self.other = other
    }
}

public protocol RTCStats {}

public struct RTCOutboundStats: RTCStats {
    public let kind: String
    public let rid: String
    public let bytesSent: UInt
    public let targetBitrate: Double
    public let packetsSent: UInt
    public let framesEncoded: UInt
    public let framesPerSecond: Double
    public let frameWidth: UInt
    public let frameHeight: UInt
    public let qualityLimitationDurations: QualityLimitationDurations?

    public init(
        kind: String = "",
        rid: String = "",
        bytesSent: UInt = 0,
        targetBitrate: Double = 0.0,
        packetsSent: UInt = 0,
        framesEncoded: UInt = 0,
        framesPerSecond: Double = 0.0,
        frameWidth: UInt = 0,
        frameHeight: UInt = 0,
        qualityLimitationDurations: QualityLimitationDurations? = nil
    ) {
        self.kind = kind
        self.rid = rid
        self.bytesSent = bytesSent
        self.targetBitrate = targetBitrate
        self.packetsSent = packetsSent
        self.framesEncoded = framesEncoded
        self.framesPerSecond = framesPerSecond
        self.frameWidth = frameWidth
        self.frameHeight = frameHeight
        self.qualityLimitationDurations = qualityLimitationDurations
    }
}

public struct RTCInboundStats: RTCStats {
    public let kind: String
    public let jitter: Double
    public let packetsLost: UInt
    public let packetsReceived: UInt
    public let bytesReceived: UInt
    public let framesReceived: UInt
    public let frameWidth: UInt
    public let frameHeight: UInt
    public let framesPerSecond: Double
    public let framesDropped: UInt

    public init(
        kind: String = "",
        jitter: Double = 0.0,
        packetsLost: UInt = 0,
        packetsReceived: UInt = 0,
        bytesReceived: UInt = 0,
        framesReceived: UInt = 0,
        frameWidth: UInt = 0,
        frameHeight: UInt = 0,
        framesPerSecond: Double = 0.0,
        framesDropped: UInt = 0
    ) {
        self.kind = kind
        self.jitter = jitter
        self.packetsLost = packetsLost
        self.packetsReceived = packetsReceived
        self.bytesReceived = bytesReceived
        self.framesReceived = framesReceived
        self.frameWidth = frameWidth
        self.frameHeight = frameHeight
        self.framesPerSecond = framesPerSecond
        self.framesDropped = framesDropped
    }
}
