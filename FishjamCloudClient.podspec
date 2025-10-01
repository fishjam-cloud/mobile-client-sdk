#
# Be sure to run `pod lib lint FishjamClient.podspec' to ensure this is a
# valid spec before submitting.

require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name             = 'FishjamCloudClient'
  s.version          = package['version']
  s.summary          = 'Fishjam SDK fully compatible with `Membrane RTC Engine` for iOS.'

  s.homepage         = 'https://github.com/fishjam-cloud/mobile-client-sdk'
  s.license          = { :type => 'Apache-2.0 license', :file => 'packages/ios-client/LICENSE' }
  s.author           = { 'Software Mansion' => 'https://swmansion.com' }
  s.source           = { :git => 'https://github.com/fishjam-cloud/mobile-client-sdk.git', :tag => s.version.to_s }

  s.ios.deployment_target = '15.1'
  s.swift_version = '5.0'

  s.source_files = 'packages/ios-client/Sources/**/*.swift'
  s.resources = 'package.json'

  s.pod_target_xcconfig = { 'ENABLE_BITCODE' => 'NO' }

  s.dependency 'WebRTC-SDK', '=125.6422.06'
  s.dependency 'SwiftProtobuf', '~> 1.18.0'
  s.dependency 'Starscream', '~> 4.0.0'
  s.dependency 'PromisesSwift'
  s.dependency 'SwiftLogJellyfish', '1.5.2'

  # Broadcast Upload Extension support
  # Includes minimal WebRTC client for broadcast extensions
  s.subspec "Broadcast" do |spec|
    spec.source_files = [
      # Core broadcast extension client
      "packages/ios-client/Sources/FishjamClient/BroadcastExtensionClient.swift",
      "packages/ios-client/Sources/FishjamClient/BroadcastClient.swift",
      "packages/ios-client/Sources/FishjamClient/ConnectConfig.swift",  # For ConnectConfig
      "packages/ios-client/Sources/FishjamClient/ReconnectionManager.swift",  # For ReconnectConfig
      
      # WebRTC components
      "packages/ios-client/Sources/FishjamClient/webrtc/PeerConnectionManager.swift",
      "packages/ios-client/Sources/FishjamClient/webrtc/PeerConnectionFactoryWrapper.swift",
      "packages/ios-client/Sources/FishjamClient/webrtc/PeerConnectionListener.swift",
      "packages/ios-client/Sources/FishjamClient/webrtc/RTCEngineCommunication.swift",
      "packages/ios-client/Sources/FishjamClient/webrtc/RTCEngineListener.swift",
      "packages/ios-client/Sources/FishjamClient/webrtc/StatsCollector.swift",
      "packages/ios-client/Sources/FishjamClient/webrtc/helpers/*.swift",
      "packages/ios-client/Sources/FishjamClient/webrtc/extensions/*.swift",
      
      # Track models
      "packages/ios-client/Sources/FishjamClient/media/Tracks/Track.swift",
      "packages/ios-client/Sources/FishjamClient/media/Tracks/VideoTrack.swift",
      "packages/ios-client/Sources/FishjamClient/media/Tracks/LocalTrack.swift",
      "packages/ios-client/Sources/FishjamClient/media/Tracks/LocalBroadcastScreenShareTrack.swift",
      "packages/ios-client/Sources/FishjamClient/media/VideoParameters.swift",
      "packages/ios-client/Sources/FishjamClient/media/Dimensions.swift",
      
      # Models
      "packages/ios-client/Sources/FishjamClient/models/Endpoint.swift",
      "packages/ios-client/Sources/FishjamClient/models/SimulcastConfig.swift",
      "packages/ios-client/Sources/FishjamClient/models/TrackBandwidthLimit.swift",
      "packages/ios-client/Sources/FishjamClient/models/Constants.swift",
      "packages/ios-client/Sources/FishjamClient/models/Encoder.swift",
      "packages/ios-client/Sources/FishjamClient/models/EncodingReason.swift",
      "packages/ios-client/Sources/FishjamClient/models/AuthError.swift",
      "packages/ios-client/Sources/FishjamClient/models/RTCStats.swift",
      
      # Protobuf messages
      "packages/ios-client/Sources/FishjamClient/protos/**/*.swift",
      
      # Utilities
      "packages/ios-client/Sources/FishjamClient/utils/AnyJson.swift",
      "packages/ios-client/Sources/FishjamClient/utils/sdkLogger.swift",
      "packages/ios-client/Sources/FishjamClient/utils/types.swift",
      "packages/ios-client/Sources/FishjamClient/utils/DispatchQueue+fishjam.swift",
      "packages/ios-client/Sources/FishjamClient/utils/SimulcastUtils.swift",

      "packages/ios-client/Sources/FishjamClient/webrtc/extensions/RTCRtpEncodingParameters.swift"
    ]
    
    # Broadcast subspec uses same dependencies as main spec
    spec.dependency 'WebRTC-SDK', '=125.6422.06'
    spec.dependency 'SwiftProtobuf', '~> 1.18.0'
    spec.dependency 'Starscream', '~> 4.0.0'
    spec.dependency 'SwiftLogJellyfish', '1.5.2'
  end
end
