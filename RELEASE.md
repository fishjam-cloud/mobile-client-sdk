## Release process:

1. Create new branch:

   - update `version` to x.y.z in [package.json](./package.json)
   - update `version` to x.y.z in [package.json](./packages/react-native-client/package.json)
   - update `s.version` to x.y.z in [FishjamCloudClient.podspec](./FishjamCloudClient.podspec)
   - update `s.dependency 'FishjamCloudClient'` to x.y.z in [RNFishjamClient.podspec](./packages/react-native-client/ios/RNFishjamClient.podspec)
   - update `packageVersion` to x.y.z in [build.gradle](./packages/react-native-client/android/build.gradle)

1. Commit, create pull request and merge it

1. Create [new release](https://github.com/fishjam-cloud/mobile-client-sdk/releases/new) with x.y.z tag
