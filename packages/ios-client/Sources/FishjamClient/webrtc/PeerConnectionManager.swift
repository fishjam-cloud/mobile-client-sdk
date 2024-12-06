import Foundation
import Logging
import WebRTC

internal class PeerConnectionManager: NSObject, RTCPeerConnectionDelegate {
    private var peerConnectionFactory: PeerConnectionFactoryWrapper
    private var listeners: [PeerConnectionListener] = []

    func addListener(_ listener: PeerConnectionListener) {
        listeners.append(listener)
    }

    func removeListener(_ listener: PeerConnectionListener) {
        listeners.removeAll {
            $0 === listener
        }
    }

    private var statsCollector: StatsCollector?
    private var connection: RTCPeerConnection? {
        didSet {
            guard let connection = connection else { return }
            statsCollector = StatsCollector(connection: connection)
        }
    }

    private var iceServers: [RTCIceServer] = []
    private var config: RTCConfiguration?

    private var midToTrackId: [String: String] = [:]

    private static let mediaConstraints = RTCMediaConstraints(
        mandatoryConstraints: nil, optionalConstraints: ["DtlsSrtpKeyAgreement": kRTCMediaConstraintsValueTrue])
    private var streamIds: [String] = [UUID().uuidString]

    internal init(config: RTCConfiguration, peerConnectionFactory: PeerConnectionFactoryWrapper) {
        self.config = config
        self.peerConnectionFactory = peerConnectionFactory
    }

    private func getSendEncodingsFromSimulcastConfig(_ simulcastConfig: SimulcastConfig) -> [RTCRtpEncodingParameters] {
        let sendEncodings = Constants.simulcastEncodings()
        simulcastConfig.activeEncodings.forEach { encoding in
            sendEncodings[encoding.rawValue].isActive = true
        }
        return sendEncodings
    }

    public func addTrack(track: Track) {
        addTrack(track: track, streamsId: streamIds)
    }

    public func addTrack(track: Track, streamsId: [String]) {
        guard let pc = connection else {
            return
        }
        let videoParameters =
            (track as? LocalCameraTrack)?.videoParameters ?? (track as? LocalBroadcastScreenShareTrack)?.videoParameters
        let simulcastConfig = videoParameters?.simulcastConfig
        var sendEncodings: [RTCRtpEncodingParameters] = []
        if track.mediaTrack?.kind == "video"
            && (track as? LocalCameraTrack)?.videoParameters.simulcastConfig.enabled == true
        {
            sendEncodings = getSendEncodingsFromSimulcastConfig(simulcastConfig!)
        } else {
            sendEncodings = [RTCRtpEncodingParameters.create(active: true)]
        }

        if let maxBandwidth = (track as? LocalCameraTrack)?.videoParameters.maxBandwidth {
            applyBitrate(encodings: sendEncodings, maxBitrate: maxBandwidth)
        }
        let transceiverInit = RTCRtpTransceiverInit()
        transceiverInit.direction = RTCRtpTransceiverDirection.sendOnly
        transceiverInit.streamIds = streamsId
        transceiverInit.sendEncodings = sendEncodings
        pc.addTransceiver(with: track.mediaTrack!, init: transceiverInit)
        pc.enforceSendOnlyDirection()
    }

    private func applyBitrate(encodings: [RTCRtpEncodingParameters], maxBitrate: TrackBandwidthLimit) {
        switch maxBitrate {
        case .BandwidthLimit(let limit):
            splitBitrate(encodings: encodings, bitrate: limit)
        case .SimulcastBandwidthLimit(let limit):
            encodings.forEach { encoding in
                let encodingLimit = limit[encoding.rid ?? ""] ?? 0
                encoding.maxBitrateBps = encodingLimit == 0 ? nil : (encodingLimit * 1024) as NSNumber
            }
        }
    }

    private func splitBitrate(encodings: [RTCRtpEncodingParameters], bitrate: Int) {
        if encodings.isEmpty {
            sdkLogger.error("\(#function): Attempted to limit bandwidth of the track that doesn't have any encodings")
            return
        }

        if bitrate == 0 {
            encodings.forEach({ encoding in
                encoding.maxBitrateBps = nil
            })
            return
        }

        let k0 = Double(
            truncating: encodings.min(by: { a, b in
                Double(truncating: a.scaleResolutionDownBy ?? 1) < Double(truncating: b.scaleResolutionDownBy ?? 1)
            })?.scaleResolutionDownBy ?? 1)

        let bitrateParts = encodings.reduce(
            0.0,
            { acc, encoding in
                acc + pow((k0 / Double(truncating: encoding.scaleResolutionDownBy ?? 1)), 2)
            })

        let x = Double(bitrate) / bitrateParts

        encodings.forEach({ encoding in
            encoding.maxBitrateBps =
                Int((x * pow(k0 / Double(truncating: encoding.scaleResolutionDownBy ?? 1), 2) * 1024)) as NSNumber
        })
    }

    public func setTrackBandwidth(trackId: String, bandwidth: BandwidthLimit) {
        guard let pc = connection else {
            sdkLogger.error("\(#function): Peer connection not yet established")
            return
        }

        guard let sender = pc.senders.first(where: { $0.track?.trackId == trackId }) else {
            sdkLogger.error("\(#function): can't find track sender with trackId=\(trackId)")
            return
        }

        let params = sender.parameters

        applyBitrate(encodings: params.encodings, maxBitrate: .BandwidthLimit(bandwidth))

        sender.parameters = params
    }

    public func setEncodingBandwidth(trackId: String, encoding: String, bandwidth: BandwidthLimit) {
        guard let pc = connection else {
            sdkLogger.error("\(#function): Peer connection not yet established")
            return
        }

        guard let sender = pc.senders.first(where: { $0.track?.trackId == trackId }) else {
            sdkLogger.error("\(#function): can't find track sender with trackId=\(trackId)")
            return
        }

        let params = sender.parameters
        let encodingParams = params.encodings.first(where: { $0.rid == encoding })
        guard let encodingParams = encodingParams else {
            sdkLogger.error("\(#function): invalid encoding=\(encoding)")
            return
        }

        encodingParams.maxBitrateBps = (bandwidth * 1024) as NSNumber

        sender.parameters = params
    }

    public func removeTrack(trackId: String) {
        if let pc = connection,
            let sender = pc.transceivers.first(where: { $0.sender.track?.trackId == trackId })?
                .sender
        {
            pc.removeTrack(sender)
        }
    }

    /// Sets up the local peer connection with previously prepared config and local media tracks.
    private func setupPeerConnection(localTracks: [Track]) {
        guard let config = config else {
            fatalError("Config is nil")
        }
        config.sdpSemantics = .unifiedPlan
        config.continualGatheringPolicy = .gatherContinually
        config.candidateNetworkPolicy = .all
        config.tcpCandidatePolicy = .disabled

        guard
            let peerConnection = peerConnectionFactory.createPeerConnection(
                config, constraints: Self.mediaConstraints)
        else {
            fatalError("Failed to initialize new PeerConnection")
        }
        connection = peerConnection

        peerConnection.delegate = self

        localTracks.forEach { track in
            addTrack(track: track, streamsId: streamIds)
        }

        peerConnection.enforceSendOnlyDirection()
    }

    public func close() {
        if let pc = connection {
            pc.close()
            connection = nil
            statsCollector = nil
            iceServers = []
            config = nil
            midToTrackId = [:]
        }
    }

    /// On each `OfferData` we receive an information about an amount of audio/video
    /// tracks that we have to receive. For each type of track we need a proper transceiver that
    /// will be used for receiving the media. So each time when we don't have an appropriate amount of audio/video
    /// transceiers just create the missing ones and set their directions to `recvOnly` which is the only direction
    /// acceptable by the `Membrane RTC Engine`.
    private func addNecessaryTransceivers(_ tracksTypes: Fishjam_MediaEvents_Server_MediaEvent.OfferData.TrackTypes) {
        guard let pc = connection else {
            return
        }

        var lackingAudio = tracksTypes.audio
        var lackingVideo = tracksTypes.video

        pc.transceivers.filter {
            $0.direction == .recvOnly
        }.forEach { transceiver in
            guard let track = transceiver.receiver.track else {
                return
            }

            switch track.kind {
            case "audio": lackingAudio -= 1
            case "video": lackingVideo -= 1
            default:
                break
            }
        }

        sdkLogger.info("peerConnection adding \(lackingAudio) audio and \(lackingVideo) video lacking transceivers")

        // NOTE: check the lacking amount just in case there are some bugs
        // that caused the lacking amount to go under zero
        if lackingAudio > 0 {
            for _ in 0..<lackingAudio {
                pc.addTransceiver(of: .audio)?.setDirection(.recvOnly, error: nil)
            }
        }

        if lackingVideo > 0 {
            for _ in 0..<lackingVideo {
                pc.addTransceiver(of: .video)?.setDirection(.recvOnly, error: nil)
            }
        }
    }

    /// Returns a mapping from `mid` of transceivers to their corresponding remote tracks' ids.
    private func getMidToTrackId(localTracks: [Track]) -> [String: String] {
        guard let pc = connection else {
            return [:]
        }

        var mapping: [String: String] = [:]
        pc.transceivers.forEach { transceiver in
            guard let trackId: String = transceiver.sender.track?.trackId else {
                return
            }
            if localTracks.map({ track in track.webrtcId }).contains(trackId) {
                mapping[transceiver.mid] = trackId
            }
        }

        return mapping
    }

    private func getTrackIdToBitrates(localTracks: [Track]) -> Dictionary<String, Fishjam_MediaEvents_Peer_MediaEvent.TrackBitrates> {
        guard let pc = connection else {
            return [:]
        }
        
        var mapping: Dictionary<String, Fishjam_MediaEvents_Peer_MediaEvent.TrackBitrates> = [:]
        pc.transceivers.forEach { transceiver in
            guard let trackId: String = transceiver.sender.track?.trackId else {
                return
            }
            var bitrate = Fishjam_MediaEvents_Peer_MediaEvent.VariantBitrate()
            bitrate.variant = .unspecified
            bitrate.bitrate = 1_500_000 // TODO(FCE-953):
            
            var trackBitrates = Fishjam_MediaEvents_Peer_MediaEvent.TrackBitrates()
            trackBitrates.trackID = trackId
            trackBitrates.variantBitrates = [bitrate]
            
            mapping[trackId] = trackBitrates

//            if let track = localTracks.first(where: { $0.webrtcId == trackId }), let videoParameters =
//                (track as? LocalCameraTrack)?.videoParameters ?? (track as? LocalBroadcastScreenShareTrack)?.videoParameters {
//                var trackBitrates = Fishjam_MediaEvents_Peer_MediaEvent.TrackBitrates()
//                trackBitrates.trackID = trackId
//                
//                videoParameters.simulcastConfig.activeEncodings.forEach { encoding in
//                    var bitrate = Fishjam_MediaEvents_Peer_MediaEvent.VariantBitrate()
//                    bitrate.variant = .unspecified
//                    bitrate.bitrate = 1_500_000 // TODO(FCE-953):
//                    trackBitrates.variantBitrates = [bitrate]
//                }
//                mapping[trackId] = trackBitrates
//            }
        }
        
        return mapping
    }

    public func setTrackEncoding(trackId: String, encoding: TrackEncoding, enabled: Bool) {
        guard let pc = connection else {
            sdkLogger.error("\(#function): Peer connection not yet established")
            return
        }

        guard let sender = pc.senders.first(where: { $0.track?.trackId == trackId }) else {
            sdkLogger.error("\(#function): can't find track sender with trackId=\(trackId)")
            return
        }

        let params = sender.parameters
        guard let encoding = params.encodings.first(where: { $0.rid == encoding.description }) else {
            sdkLogger.error("\(#function): invalid encoding=\(encoding)")
            return
        }
        encoding.isActive = enabled
        sender.parameters = params
    }


    public func getStats() -> [String: RTCStats] {
        return statsCollector?.peerConnectionStats ?? [:]
    }

    public func getSdpOffer(
        tracksTypes: Fishjam_MediaEvents_Server_MediaEvent.OfferData.TrackTypes,
        localTracks: [Track],
        onCompletion: @escaping (
            _ sdp: String?, _ midToTrackId: [String: String]?, _ trackIdToBitrates: Dictionary<String, Fishjam_MediaEvents_Peer_MediaEvent.TrackBitrates>?, _ error: Error?
        ) -> Void
    ) {

        config = RTCConfiguration()
        config?.iceServers = []
        config?.iceTransportPolicy = .all

        if connection == nil {
            setupPeerConnection(localTracks: localTracks)
        }

        guard let pc = connection else {
            return
        }

        addNecessaryTransceivers(tracksTypes)

        pc.offer(
            for: Self.mediaConstraints,
            completionHandler: { offer, error in
                guard let offer = offer else {
                    if let err = error {
                        onCompletion(nil, nil, nil, err)
                    }
                    return
                }

                pc.setLocalDescription(
                    offer,
                    completionHandler: { error in
                        guard let err = error else {
                            onCompletion(
                                offer.sdp,
                                self.getMidToTrackId(localTracks: localTracks),
                                self.getTrackIdToBitrates(localTracks: localTracks),
                                nil)
                            return
                        }
                        onCompletion(nil, nil, nil, err)
                    })
            })
    }

    func disableEncodings(sdpAnswer: String, encodingsToDisable: [String]) -> String {
        var newSdpAnswer = ""
        let prefix = "a=simulcast:recv "

        let sdpLines = sdpAnswer.components(separatedBy: "\r\n").dropLast(1)

        for line in sdpLines {
            if line.hasPrefix(prefix) {
                let lineSuffix = String(line.suffix(from: prefix.endIndex))

                let encodings = lineSuffix.components(separatedBy: ";")

                var newEncodings = [String]()
                for encoding in encodings {
                    if encodingsToDisable.contains(encoding) {
                        newEncodings.append("~\(encoding)")
                    } else {
                        newEncodings.append(encoding)
                    }
                }

                let newLine = prefix + newEncodings.joined(separator: ";") + "\r\n"
                newSdpAnswer += newLine
            } else {
                newSdpAnswer += "\(line)\r\n"
            }
        }

        return newSdpAnswer
    }

    public func setupIceServers(iceServers: [Fishjam_MediaEvents_Server_MediaEvent.IceServer]) {
        self.iceServers = iceServers.map {
            RTCIceServer(urlStrings: $0.urls, username: $0.username, credential: $0.credential)
        }
    }

    public func onSdpAnswer(sdp: String, midToTrackId: [String: String]) {
        guard let pc = connection else {
            return
        }

        self.midToTrackId = midToTrackId

        let description = RTCSessionDescription(type: .answer, sdp: sdp)

        pc.setRemoteDescription(
            description,
            completionHandler: {   error in
                guard let err = error else {
                    return
                }
                sdkLogger.error("error occured while trying to set a remote description \(err)")
            })
    }

    public func onRemoteCandidate(candidate: RTCIceCandidate) {
        guard let pc = connection else {
            return
        }

        pc.add(
            candidate,
            completionHandler: { error in
                guard let err = error else {
                    return
                }

                sdkLogger.error("error occured  during remote ice candidate processing: \(err)")
            })
    }

    public func peerConnection(_: RTCPeerConnection, didAdd _: RTCMediaStream) {
        sdkLogger.info("\(pcLogPrefix) new stream added")
    }

    public func peerConnection(_: RTCPeerConnection, didRemove _: RTCMediaStream) {
        sdkLogger.info("\(pcLogPrefix) stream has been removed")
    }

    public func peerConnection(_: RTCPeerConnection, didChange stateChanged: RTCSignalingState) {
        let descriptions: [RTCSignalingState: String] = [
            .haveLocalOffer: "have local offer",
            .haveRemoteOffer: "have remote offer",
            .haveLocalPrAnswer: "have local pr answer",
            .haveRemotePrAnswer: "have remote pr answer",
            .stable: "stable",
            .closed: "closed",
        ]

        sdkLogger.debug(
            "\(pcLogPrefix) changed signaling state to \(descriptions[stateChanged] ?? "unknown")")
    }

    public func peerConnection(
        _: RTCPeerConnection, didStartReceivingOn transceiver: RTCRtpTransceiver
    ) {
        guard
            let trackId = midToTrackId[transceiver.mid]
        else {
            sdkLogger.error(
                "\(pcLogPrefix) started receiving on a transceiver with an unknown 'mid' parameter"
            )
            return
        }

        let track = transceiver.receiver.track

        listeners.forEach { $0.onAddTrack(trackId: trackId, webrtcTrack: track!) }

        sdkLogger.debug(
            "\(pcLogPrefix) started receiving on a transceiver with a mid: \(transceiver.mid) and id \(transceiver.receiver.track?.trackId ?? "")"
        )
    }

    public func peerConnection(
        _: RTCPeerConnection,
        didAdd receiver: RTCRtpReceiver, streams _: [RTCMediaStream]
    ) {
        sdkLogger.info("\(pcLogPrefix) new receiver has been added: \(receiver.receiverId)")
    }

    public func peerConnection(_: RTCPeerConnection, didRemove rtpReceiver: RTCRtpReceiver) {
        sdkLogger.info("\(pcLogPrefix) receiver has been removed: \(rtpReceiver.receiverId)")
    }

    public func peerConnection(
        _: RTCPeerConnection, didChangeLocalCandidate local: RTCIceCandidate,
        remoteCandidate remote: RTCIceCandidate, lastReceivedMs _: Int32, changeReason reason: String
    ) {
        sdkLogger.debug(
            "\(pcLogPrefix) a local candidate has been changed due to: '\(reason)'\nlocal: \(local.sdp)\nremote: \(remote.sdp)"
        )
    }

    public func peerConnectionShouldNegotiate(_: RTCPeerConnection) {
        sdkLogger.debug("\(pcLogPrefix) should negotiate")
    }

    public func peerConnection(_: RTCPeerConnection, didChange newState: RTCIceConnectionState) {
        let descriptions: [RTCIceConnectionState: String] = [
            .new: "new",
            .checking: "checking",
            .connected: "connected",
            .closed: "closed",
            .completed: "completed",
            .disconnected: "disconnected",
            .failed: "failed",
            .count: "count",
        ]

        sdkLogger.debug("\(pcLogPrefix) new connection state: \(descriptions[newState] ?? "unknown")")

    }

    public func peerConnection(_: RTCPeerConnection, didChange newState: RTCIceGatheringState) {
        let descriptions: [RTCIceGatheringState: String] = [
            .new: "new",
            .gathering: "gathering",
            .complete: "complete",
        ]

        sdkLogger.debug(
            "\(pcLogPrefix) new ice gathering state: \(descriptions[newState] ?? "unknown")")
    }

    public func peerConnection(_: RTCPeerConnection, didGenerate candidate: RTCIceCandidate) {
        listeners.forEach { $0.onLocalIceCandidate(candidate: candidate) }
    }

    public func peerConnection(_: RTCPeerConnection, didRemove _: [RTCIceCandidate]) {
        sdkLogger.debug("\(pcLogPrefix) a list of candidates has been removed")
    }

    public func peerConnection(_: RTCPeerConnection, didOpen _: RTCDataChannel) {}
}
