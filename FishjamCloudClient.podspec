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

  s.subspec "Broadcast" do |spec|
    spec.source_files = "packages/ios-client/Sources/FishjamClient/media/BroadcastSampleSource.swift", "packages/ios-client/Sources/FishjamClient/ipc/**/*.{h,m,mm,swift}"
  end
end
