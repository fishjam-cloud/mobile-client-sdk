## Release process:

1. Create new branch

- update s.version to x.y.z in [FishjamCloudClient.podspec](./FishjamCloudClient.podspec)
- update s.version to x.y.z in [RNFishjamClient.podspec](./packages/react-native-client/ios/RNFishjamClient.podspec)
- update version to x.y.z in [package.json](./packages/react-native-client/package.json)
- update version to x.y.z in [package.json](./package.json)
- update version to x.y.z in [build.gradle](./packages/react-native-client/android/build.gradle)
- update `implementation 'com.github.fishjam-cloud:mobile-client-sdk:a.b.c'` to x.y.z in [build.gradle](./packages/react-native-client/android/build.gradle)
- commit
- create pull request and ( after checks etc) merge it
- create tag x.y.z and push to origin

