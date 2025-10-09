import Foundation

public enum VideoCodec: String {
    case vp8 = "VP8"
    case h264 = "H264"
}

/// Represents SDP (Session Description Protocol) information with utilities for codec detection
public struct SdpInfo {
    public let sdp: String
    public let detectedCodec: VideoCodec?
    
    public init(sdp: String) {
        self.sdp = sdp
        self.detectedCodec = SdpInfo.detectVideoCodec(sdp: sdp)
    }
    
    public func hasInactiveMedia() -> Bool {
        return sdp.contains("a=inactive")
    }

    private static func detectVideoCodec(sdp: String) -> VideoCodec? {
        let sdpLines = sdp.components(separatedBy: "\r\n")
        var inVideoSection = false
        
        for line in sdpLines {
            // Track when we enter a video media section
            if line.hasPrefix("m=video") {
                inVideoSection = true
                continue
            }
            
            // Exit video section when we hit another media type
            if line.hasPrefix("m=") && !line.hasPrefix("m=video") {
                inVideoSection = false
                continue
            }
            
            // Only process rtpmap lines within video section
            if inVideoSection && line.contains("a=rtpmap:") {
                let upperLine = line.uppercased()
                
                // Check for codec names in the rtpmap line
                // Format: a=rtpmap:<payload-type> <codec-name>/<clock-rate>
                if upperLine.contains("H264") {
                    return .h264
                } else if upperLine.contains("VP8") {
                    return .vp8
                }
            }
        }
        
        return nil
    }
}
