import ExpoModulesCore

struct RNSimulcastConfig: Record {
    @Field
    var enabled: Bool = false

    @Field
    var activeEncodings: [String] = []
}

struct CameraConfig: Record {
    @Field
    var quality: String = "VGA169"

    @Field
    var flipVideo: Bool = false

    @Field
    var videoTrackMetadata: [String: Any] = [:]

    @Field
    var simulcastConfig: RNSimulcastConfig = RNSimulcastConfig()

    @Field
    var maxBandwidth: RNTrackBandwidthLimit = RNTrackBandwidthLimit(0)

    @Field
    var cameraEnabled: Bool = true

    @Field
    var captureDeviceId: String? = nil
}

struct MicrophoneConfig: Record {
    @Field
    var audioTrackMetadata: [String: Any] = [:]

    @Field
    var microphoneEnabled: Bool = true
}

struct ScreencastOptions: Record {
    @Field
    var quality: String = "HD15"

    @Field
    var screencastMetadata: [String: Any] = [:]

    @Field
    var simulcastConfig: RNSimulcastConfig = RNSimulcastConfig()

    @Field
    var maxBandwidth: RNTrackBandwidthLimit = RNTrackBandwidthLimit(0)
}

typealias RNTrackBandwidthLimit = Either<Int, [String: Int]>

public class RNFishjamClientModule: Module {
    public func definition() -> ModuleDefinition {
        Name("RNFishjamClient")

        Events(
            "IsCameraOn",
            "IsMicrophoneOn",
            "IsScreencastOn",
            "SimulcastConfigUpdate",
            "PeersUpdate",
            "AudioDeviceUpdate",
            "SendMediaEvent",
            "BandwidthEstimation")

        let rnFishjamClient: RNFishjamClient = RNFishjamClient {
            (eventName: String, data: [String: Any]) in
            self.sendEvent(eventName, data)
        }

        AsyncFunction("connect") { (url: String, peerToken: String, peerMetadata: [String: Any], promise: Promise) in
            try rnFishjamClient.create()
            rnFishjamClient.connect(url: url, peerToken: peerToken, peerMetadata: peerMetadata, promise: promise)
        }

        AsyncFunction("leaveRoom") {
            rnFishjamClient.leaveRoom()
        }

        AsyncFunction("startCamera") { (config: CameraConfig) in
            try rnFishjamClient.startCamera(config: config)
        }

        AsyncFunction("startMicrophone") { (config: MicrophoneConfig) in
            try rnFishjamClient.startMicrophone(config: config)
        }

        Property("isMicrophoneOn") {
            return rnFishjamClient.isMicEnabled
        }

        AsyncFunction("toggleMicrophone") {
            try rnFishjamClient.toggleMicrophone()
        }

        Property("isCameraOn") {
            return rnFishjamClient.isCameraEnabled
        }

        AsyncFunction("toggleCamera") {
            try rnFishjamClient.toggleCamera()
        }

        AsyncFunction("flipCamera") {
            try rnFishjamClient.flipCamera()
        }

        AsyncFunction("switchCamera") { (captureDeviceId: String) in
            try rnFishjamClient.switchCamera(captureDeviceId: captureDeviceId)
        }

        AsyncFunction("getCaptureDevices") {
            rnFishjamClient.getCaptureDevices()
        }

        AsyncFunction("toggleScreencast") { (screencastOptions: ScreencastOptions) in
            try rnFishjamClient.toggleScreencast(screencastOptions: screencastOptions)
        }

        Property("isScreencastOn") {
            return rnFishjamClient.isScreensharingEnabled
        }

        AsyncFunction("getPeers") {
            rnFishjamClient.getPeers()
        }

        AsyncFunction("updatePeerMetadata") { (metadata: [String: Any]) in
            try rnFishjamClient.updatePeerMetadata(metadata: metadata)
        }

        AsyncFunction("updateVideoTrackMetadata") { (metadata: [String: Any]) in
            try rnFishjamClient.updateVideoTrackMetadata(metadata: metadata)
        }

        AsyncFunction("updateAudioTrackMetadata") { (metadata: [String: Any]) in
            try rnFishjamClient.updateAudioTrackMetadata(metadata: metadata)
        }

        AsyncFunction("updateScreencastTrackMetadata") { (metadata: [String: Any]) in
            try rnFishjamClient.updateScreencastTrackMetadata(metadata: metadata)
        }

        AsyncFunction("toggleScreencastTrackEncoding") { (encoding: String) in
            try rnFishjamClient.toggleScreencastTrackEncoding(encoding: encoding)
        }

        AsyncFunction("setScreencastTrackBandwidth") { (bandwidth: Int) in
            try rnFishjamClient.setScreencastTrackBandwidth(bandwidth: bandwidth)
        }

        AsyncFunction("setScreencastTrackEncodingBandwidth") { (encoding: String, bandwidth: Int) in
            try rnFishjamClient.setScreencastTrackEncodingBandwidth(
                encoding: encoding, bandwidth: bandwidth)
        }

        AsyncFunction("setTargetTrackEncoding") { (trackId: String, encoding: String) in
            try rnFishjamClient.setTargetTrackEncoding(trackId: trackId, encoding: encoding)
        }

        AsyncFunction("toggleVideoTrackEncoding") { (encoding: String) in
            try rnFishjamClient.toggleVideoTrackEncoding(encoding: encoding)
        }

        AsyncFunction("setVideoTrackEncodingBandwidth") { (encoding: String, bandwidth: Int) in
            try rnFishjamClient.setVideoTrackEncodingBandwidth(
                encoding: encoding, bandwidth: bandwidth)
        }

        AsyncFunction("setVideoTrackBandwidth") { (bandwidth: Int) in
            try rnFishjamClient.setVideoTrackBandwidth(bandwidth: bandwidth)
        }

        AsyncFunction("changeWebRTCLoggingSeverity") { (severity: String) in
            try rnFishjamClient.changeWebRTCLoggingSeverity(severity: severity)
        }

        AsyncFunction("getStatistics") {
            rnFishjamClient.getStatistics()
        }

        AsyncFunction("selectAudioSessionMode") { (sessionMode: String) in
            try rnFishjamClient.selectAudioSessionMode(sessionMode: sessionMode)
        }

        AsyncFunction("showAudioRoutePicker") { () in
            rnFishjamClient.showAudioRoutePicker()
        }

        AsyncFunction("startAudioSwitcher") {
            rnFishjamClient.startAudioSwitcher()
        }
    }
}
