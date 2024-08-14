import Foundation
import Logging
import WebRTC

internal class PeerConnectionManager: NSObject, RTCPeerConnectionDelegate {
    // `RTCPeerConnection` config
    private var config: RTCConfiguration

    private var peerConnectionFactory: PeerConnectionFactoryWrapper

    // Underyling RTC connection
    private var connection: RTCPeerConnection?

    // List of ice (may be turn) servers that are used for initializing the `RTCPeerConnection`
    private var iceServers: [RTCIceServer]

    // mapping from transceiver's mid to its remote track id
    private var midToTrackId: [String: String] = [:]

    private static let mediaConstraints = RTCMediaConstraints(
        mandatoryConstraints: nil,
        optionalConstraints: ["DtlsSrtpKeyAgreement": kRTCMediaConstraintsValueTrue])

    // a common stream ID used for all non-screenshare and audio tracks
    private let localStreamId = UUID().uuidString

    private let peerConnectionListener: PeerConnectionListener

    private var peerConnectionStats: [String: RTCStats] = [:]

    internal init(
        config: RTCConfiguration, peerConnectionFactory: PeerConnectionFactoryWrapper,
        peerConnectionListener: PeerConnectionListener
    ) {
        self.config = config
        iceServers = []
        self.peerConnectionFactory = peerConnectionFactory
        self.peerConnectionListener = peerConnectionListener
    }

    public func close() {
        if let pc = connection {
            pc.close()
            self.connection = nil
        }
    }

    // Default ICE server when no turn servers are specified
    private static func defaultIceServer() -> RTCIceServer {
        let iceUrl = "stun:stun.l.google.com:19302"

        return RTCIceServer(urlStrings: [iceUrl])
    }

    /// Sets up the local peer connection with previously prepared config and local media tracks.
    private func setupPeerConnection(localTracks: [LocalTrack]) {
        let config = self.config
        config.sdpSemantics = .unifiedPlan
        config.continualGatheringPolicy = .gatherContinually
        config.candidateNetworkPolicy = .all
        config.tcpCandidatePolicy = .disabled

        // if ice servers are not empty that probably means we are using turn servers
        if iceServers.count > 0 {
            self.config.iceServers = iceServers
        } else {
            self.config.iceServers = [Self.defaultIceServer()]
        }

        guard
            let peerConnection = peerConnectionFactory.createPeerConnection(
                config, constraints: Self.mediaConstraints)
        else {
            fatalError("Failed to initialize new PeerConnection")
        }
        connection = peerConnection

        peerConnection.delegate = self

        localTracks.forEach { track in
            addTrack(track: track, localStreamId: localStreamId)
        }

        peerConnection.enforceSendOnlyDirection()
    }

    /// Parses a list of turn servers and sets them up as `iceServers` that can be used for `RTCPeerConnection` ceration.
    private func setTurnServers(_ turnServers: [OfferDataEvent.TurnServer]) {
        config.iceTransportPolicy = .relay

        let servers: [RTCIceServer] = turnServers.map { server in
            let url = [
                "turn", ":", server.serverAddr, ":", String(server.serverPort), "?transport=",
                server.transport,
            ].joined()

            return RTCIceServer(
                urlStrings: [url],
                username: server.username,
                credential: server.password
            )
        }

        iceServers = servers
    }

    /// On each `OfferData` we receive an information about an amount of audio/video
    /// tracks that we have to receive. For each type of track we need a proper transceiver that
    /// will be used for receiving the media. So each time when we don't have an appropriate amount of audio/video
    /// transceiers just create the missing ones and set their directions to `recvOnly` which is the only direction
    /// acceptable by the `Membrane RTC Engine`.
    private func addNecessaryTransceivers(_ tracksTypes: [String: Int]) {
        guard let pc = connection else {
            return
        }

        let necessaryAudio = tracksTypes["audio"] ?? 0
        let necessaryVideo = tracksTypes["video"] ?? 0

        var lackingAudio: Int = necessaryAudio
        var lackingVideo: Int = necessaryVideo

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

        sdkLogger.info(
            "peerConnection adding \(lackingAudio) audio and \(lackingVideo) video lacking transceivers")

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
    private func getMidToTrackId(localTracks: [LocalTrack]) -> [String: String] {
        guard let pc = connection else {
            return [:]
        }

        var mapping: [String: String] = [:]
        let localTracksKeys = localTracks.map { track in track.trackId() }
        let localTracks: [String] = Array(localTracksKeys)

        pc.transceivers.forEach { transceiver in
            guard let trackId: String = transceiver.sender.track?.trackId,
                localTracks.contains(trackId)
            else {
                return
            }
            mapping[transceiver.mid] = trackId
        }

        return mapping
    }

    public func addTrack(track: LocalTrack, localStreamId: String) {
        guard let pc = connection else {
            return
        }

        let transceiverInit = RTCRtpTransceiverInit()
        transceiverInit.direction = RTCRtpTransceiverDirection.sendOnly
        transceiverInit.streamIds = [localStreamId]
        var sendEncodings: [RTCRtpEncodingParameters] = []
        if track.rtcTrack().kind == "video"
            && (track as? LocalVideoTrack)?.videoParameters.simulcastConfig.enabled == true
        {
            let simulcastConfig = (track as? LocalVideoTrack)?.videoParameters.simulcastConfig

            sendEncodings = Constants.simulcastEncodings()

            simulcastConfig?.activeEncodings.forEach { enconding in
                sendEncodings[enconding.rawValue].isActive = true
            }
        } else {
            sendEncodings = [RTCRtpEncodingParameters.create(active: true)]
        }
        if let maxBandwidth = (track as? LocalVideoTrack)?.videoParameters.maxBandwidth {
            applyBitrate(encodings: sendEncodings, maxBitrate: maxBandwidth)
        }
        transceiverInit.sendEncodings = sendEncodings
        pc.addTransceiver(with: track.rtcTrack(), init: transceiverInit)
        pc.enforceSendOnlyDirection()
    }

    public func removeTrack(trackId: String) {
        if let pc = connection,
            let sender = pc.transceivers.first(where: { $0.sender.track?.trackId == trackId })?
                .sender
        {
            pc.removeTrack(sender)
        }
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

    private func extractRelevantStats(rp: RTCStatisticsReport) {
        rp.statistics.forEach { it1 in
            let it = it1.value
            if it.type == "outbound-rtp" {
                let duration = it.values["qualityLimitationDurations"] as? [String: Double]
                let qualityLimitation: QualityLimitationDurations = QualityLimitationDurations(
                    bandwidth: duration?["bandwidth"] ?? 0.0,
                    cpu: duration?["cpu"] ?? 0.0, none: duration?["none"] ?? 0.0, other: duration?["other"] ?? 0.0)

                let tmp = RTCOutboundStats(
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

                peerConnectionStats[it.id as String] = tmp
            } else if it.type == "inbound-rtp" {
                let tmp = RTCInboundStats(
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

                peerConnectionStats[it.id as String] = tmp
            }
        }
    }

    public func getStats() -> [String: RTCStats] {
        if let connection = connection {
            connection.statistics(completionHandler: { RTCStatisticsReport in
                self.extractRelevantStats(rp: RTCStatisticsReport)
            })
        }
        return peerConnectionStats
    }

    private func applyBitrate(encodings: [RTCRtpEncodingParameters], maxBitrate: TrackBandwidthLimit) {
        switch maxBitrate {
        case .BandwidthLimit(let limit):
            splitBitrate(encodings: encodings, bitrate: limit)
            break
        case .SimulcastBandwidthLimit(let limit):
            encodings.forEach { encoding in
                let encodingLimit = limit[encoding.rid ?? ""] ?? 0
                encoding.maxBitrateBps = encodingLimit == 0 ? nil : (encodingLimit * 1024) as NSNumber
            }
            break
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
            truncating:
                encodings.min(by: {
                    a, b in
                    Double(truncating: a.scaleResolutionDownBy ?? 1)
                        < Double(truncating: b.scaleResolutionDownBy ?? 1)
                })?.scaleResolutionDownBy ?? 1)

        let bitrateParts = encodings.reduce(
            0.0,
            { acc, encoding in
                acc + pow((k0 / Double(truncating: encoding.scaleResolutionDownBy ?? 1)), 2)
            })

        let x = Double(bitrate) / bitrateParts

        encodings.forEach({ encoding in
            encoding.maxBitrateBps =
                Int((x * pow(k0 / Double(truncating: encoding.scaleResolutionDownBy ?? 1), 2) * 1024))
                as NSNumber
        })
    }

    public func getSdpOffer(
        integratedTurnServers: [OfferDataEvent.TurnServer],
        tracksTypes: [String: Int],
        localTracks: [LocalTrack],
        onCompletion: @escaping (_ sdp: String?, _ midToTrackId: [String: String]?, _ error: Error?) -> Void
    ) {
        setTurnServers(integratedTurnServers)

        var needsRestart = true
        if connection == nil {
            setupPeerConnection(localTracks: localTracks)
            needsRestart = false
        }

        guard let pc = connection else {
            return
        }

        if needsRestart {
            pc.restartIce()
        }

        addNecessaryTransceivers(tracksTypes)

        pc.offer(
            for: Self.mediaConstraints,
            completionHandler: { offer, error in
                guard let offer = offer else {
                    if let err = error {
                        onCompletion(nil, nil, err)
                    }
                    return
                }

                pc.setLocalDescription(
                    offer,
                    completionHandler: { error in
                        guard let err = error else {
                            onCompletion(offer.sdp, self.getMidToTrackId(localTracks: localTracks), nil)
                            return
                        }
                        onCompletion(nil, nil, err)
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

    public func onSdpAnswer(sdp: String, midToTrackId: [String: String?], localTracks: [LocalTrack]) {
        guard let pc = connection else {
            return
        }

        // FIXEME: trackId returned from backend sometimes happens to be null...
        self.midToTrackId = midToTrackId.filter { $0.value != nil } as! [String: String]

        // this is workaround of a backend issue with ~ in sdp answer
        // client sends sdp offer with disabled tracks marked with ~, backend doesn't send ~ in sdp answer so all tracks are enabled
        // and we need to disable them manually
        var encodingsToDisable = [String]()
        let encodings: [TrackEncoding] = [.h, .m, .l]
        encodings.forEach({ encoding in
            localTracks.forEach({ track in
                if track.rtcTrack().kind == "video"
                    && (track as? LocalVideoTrack)?.videoParameters.simulcastConfig.enabled ?? false
                    && (track as? LocalVideoTrack)?.videoParameters.simulcastConfig.activeEncodings.contains(encoding)
                        != true
                {
                    encodingsToDisable.append(encoding.description)
                }
            })
        })

        let sdpWithDisabledEncodings = disableEncodings(sdpAnswer: sdp, encodingsToDisable: encodingsToDisable)

        let description = RTCSessionDescription(type: .answer, sdp: sdpWithDisabledEncodings)
        pc.setRemoteDescription(
            description,
            completionHandler: { error in
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
        guard let trackId = midToTrackId[transceiver.mid]
        else {
            sdkLogger.error(
                "\(pcLogPrefix) started receiving on a transceiver with an unknown 'mid' parameter"
            )
            return
        }

        let track = transceiver.receiver.track

        peerConnectionListener.onAddTrack(trackId: trackId, track: track!)

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

        peerConnectionListener.onPeerConnectionStateChange(newState: newState)
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
        peerConnectionListener.onLocalIceCandidate(candidate: candidate)
    }

    public func peerConnection(_: RTCPeerConnection, didRemove _: [RTCIceCandidate]) {
        sdkLogger.debug("\(pcLogPrefix) a list of candidates has been removed")
    }

    public func peerConnection(_: RTCPeerConnection, didOpen _: RTCDataChannel) {}
}
