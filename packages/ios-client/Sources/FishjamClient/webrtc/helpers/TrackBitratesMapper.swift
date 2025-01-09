import WebRTC

struct TrackBitratesMapper {
    static func mapTracksToProtoBitrates(localTracks: [Track]) -> [String: Fishjam_MediaEvents_Peer_MediaEvent
        .TrackBitrates]
    {
        Dictionary(
            uniqueKeysWithValues: localTracks.compactMap {
                t -> (String, Fishjam_MediaEvents_Peer_MediaEvent.TrackBitrates)? in
                guard let track = t as? LocalCameraTrack else { return nil }

                let bitrates: [Fishjam_MediaEvents_Peer_MediaEvent.VariantBitrate] = track.sendEncodings.compactMap {
                    param in
                    guard let ridString = param.rid else { return nil }
                    var variantBitrate = Fishjam_MediaEvents_Peer_MediaEvent.VariantBitrate()
                    let trackEncoding = try? TrackEncoding(ridString)
                    variantBitrate.variant =
                        Fishjam_MediaEvents_Variant(rawValue: trackEncoding?.rawValue ?? 0) ?? .unspecified
                    variantBitrate.bitrate = param.maxBitrateBps?.int32Value ?? 0
                    return variantBitrate
                }

                var trackBitrates = Fishjam_MediaEvents_Peer_MediaEvent.TrackBitrates()
                trackBitrates.trackID = track.webrtcId
                trackBitrates.variantBitrates = bitrates

                return (track.webrtcId, trackBitrates)
            })
    }
}
