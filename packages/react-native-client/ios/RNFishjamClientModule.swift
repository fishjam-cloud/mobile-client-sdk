import ExpoModulesCore

struct RNSimulcastConfig: Record {
    @Field
    var enabled: Bool = false
}

struct CameraConfig: Record {
    @Field
    var quality: String = "VGA169"

    @Field
    var flipDimensions: Bool = false

    @Field
    var videoTrackMetadata: [String: Any] = [:]

    @Field
    var simulcastConfig: RNSimulcastConfig = RNSimulcastConfig()

    @Field
    var cameraEnabled: Bool = true

    @Field
    var cameraId: String? = nil
}

struct MicrophoneConfig: Record {
    @Field
    var audioTrackMetadata: [String: Any] = [:]

    @Field
    var microphoneEnabled: Bool = true
}

struct ScreenShareOptions: Record {
    @Field
    var quality: String = "HD15"

    @Field
    var screenShareMetadata: [String: Any] = [:]

    @Field
    var simulcastConfig: RNSimulcastConfig = RNSimulcastConfig()
}

struct ReconnectConfig: Record {
    @Field
    var maxAttempts: Int = 5

    @Field
    var initialDelayMs: Int = 1000

    @Field
    var delayMs: Int = 1000
}

struct ConnectConfig: Record {
    @Field
    var reconnectConfig: ReconnectConfig = ReconnectConfig()
}

typealias RNTrackBandwidthLimit = Either<Int, [String: Int]>

public class RNFishjamClientModule: Module {
  public func definition() -> ModuleDefinition {
    let rnFishjamClient: RNFishjamClient = {
      let client = RNFishjamClient(sendEvent)
      client.create()
      return client
    }()

    Name("RNFishjamClient")

    Events(EmitableEvent.allEvents)
    
    OnCreate {
          let permissionsManager = self.appContext?.permissions
          EXPermissionsMethodsDelegate.register(
            [
              CameraOnlyPermissionRequester(),
              CameraMicrophonePermissionRequester()
            ],
            withPermissionsManager: permissionsManager
          )
        }

    Property("peerStatus") {
      return rnFishjamClient.peerStatus.rawValue
    }

    Property("reconnectionStatus") {
      return rnFishjamClient.reconnectionStatus.rawValue
    }

    Property("isMicrophoneOn") {
      return rnFishjamClient.isMicrophoneOn
    }

    Property("isCameraOn") {
      return rnFishjamClient.isCameraOn
    }

    Property("cameras") {
      return rnFishjamClient.getCaptureDevices()
    }

    Property("currentCamera") {
      return rnFishjamClient.currentCamera
    }

    Property("isScreenShareOn") {
      return rnFishjamClient.isScreenShareOn
    }

    Property("isAppScreenShareOn") {
      return rnFishjamClient.isAppScreenShareOn
    }

    Property("isCameraInitialized") {
      return rnFishjamClient.isCameraInitialized
    }

    Function("getPeers") {
      return rnFishjamClient.getPeers()
    }

    AsyncFunction("joinRoom") {
      (
        url: String, peerToken: String, peerMetadata: [String: Any], config: ConnectConfig,
        promise: Promise
      ) in
      rnFishjamClient.joinRoom(
        url: url, peerToken: peerToken, peerMetadata: peerMetadata, config: config,
        promise: promise)
    }

    AsyncFunction("leaveRoom") {
      rnFishjamClient.leaveRoom()
    }

    AsyncFunction("startCamera") { (config: CameraConfig) in
      try await rnFishjamClient.startCamera(config: config)
    }

    AsyncFunction("toggleMicrophone") {
      try await rnFishjamClient.toggleMicrophone()
    }
    
    AsyncFunction("startMicrophone") {
      try await rnFishjamClient.startMicrophone()
    }

    AsyncFunction("stopMicrophone") {
      try rnFishjamClient.stopMicrophone()
    }

    AsyncFunction("toggleCamera") {
      try rnFishjamClient.toggleCamera()
    }

    AsyncFunction("flipCamera") {
      try rnFishjamClient.flipCamera()
    }

    AsyncFunction("switchCamera") { (cameraId: String) in
      try rnFishjamClient.switchCamera(cameraId: cameraId)
    }

    AsyncFunction("toggleScreenShare") { (screenShareOptions: ScreenShareOptions) in
      try rnFishjamClient.toggleScreenShare(screenShareOptions: screenShareOptions)
    }

    AsyncFunction("toggleAppScreenShare") { (screenShareOptions: ScreenShareOptions) in
      try rnFishjamClient.toggleAppScreenShare(screenShareOptions: screenShareOptions)
    }

    AsyncFunction("updatePeerMetadata") { (metadata: [String: Any]) in
      try rnFishjamClient.updatePeerMetadata(metadata: metadata)
    }

    AsyncFunction("updateVideoTrackMetadata") { (metadata: [String: Any]) in
      try rnFishjamClient.updateLocalVideoTrackMetadata(metadata: metadata)
    }

    AsyncFunction("updateScreenShareTrackMetadata") { (metadata: [String: Any]) in
      try rnFishjamClient.updateLocalScreenShareTrackMetadata(metadata: metadata)
    }

    AsyncFunction("toggleScreenShareTrackEncoding") { (encoding: String) in
      try rnFishjamClient.toggleScreenShareTrackEncoding(encoding: encoding)
    }

    AsyncFunction("setScreenShareTrackBandwidth") { (bandwidth: Int) in
      try rnFishjamClient.setScreenShareTrackBandwidth(bandwidth: bandwidth)
    }

    AsyncFunction("setScreenShareTrackEncodingBandwidth") { (encoding: String, bandwidth: Int) in
      try rnFishjamClient.setScreenShareTrackEncodingBandwidth(
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
      try await rnFishjamClient.getStatistics()
    }

    AsyncFunction("selectAudioSessionMode") { (sessionMode: String) in
      try rnFishjamClient.selectAudioSessionMode(sessionMode: sessionMode)
    }

    AsyncFunction("showAudioRoutePicker") {
      rnFishjamClient.showAudioRoutePicker()
    }

    AsyncFunction("startAudioSwitcher") {
      rnFishjamClient.startAudioSwitcher()
    }

    AsyncFunction("getCameraPermissionsAsync") { (promise: Promise) in
      EXPermissionsMethodsDelegate.getPermissionWithPermissionsManager(
        self.appContext?.permissions,
        withRequester: CameraOnlyPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("requestCameraPermissionsAsync") { (promise: Promise) in
      EXPermissionsMethodsDelegate.askForPermission(
        withPermissionsManager: self.appContext?.permissions,
        withRequester: CameraOnlyPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("getMicrophonePermissionsAsync") { (promise: Promise) in
      EXPermissionsMethodsDelegate.getPermissionWithPermissionsManager(
        self.appContext?.permissions,
        withRequester: CameraMicrophonePermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("requestMicrophonePermissionsAsync") { (promise: Promise) in
      EXPermissionsMethodsDelegate.askForPermission(
        withPermissionsManager: self.appContext?.permissions,
        withRequester: CameraMicrophonePermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    }
  }

