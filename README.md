# Fishjam Cloud Mobile Client

Monorepo containing mobile SDKs for [Fishjam](https://github.com/fishjam-dev/fishjam) server

- [android-client](./packages/android-client/README.md)
- [ios-client](./packages/ios-client/README.md)
- [react-native](./packages/react-native-client/README.md)

# Documentation

API documentation is available here:
[Android](https://fishjam-cloud.github.io/mobile-client-sdk/modules/android_client.html)
[iOS](https://fishjam-cloud.github.io/mobile-client-sdk/modules/ios_client.html)
[React Native](https://fishjam-cloud.github.io/mobile-client-sdk/modules/_fishjam_cloud_react_native_client.html)

# Example

We strongly recommend checking out our example app that implements a basic video
room client. To run the app:

1. Go to Membrane's server demo repo:
   https://fishjam.io/app/login Follow instructions there
   to setup and run demo server.
2. Clone the repo
3. ```
      yarn
      yarn build
      cd `examples/fishjam-chat`
      npx expo prebuild --clean
      yarn run android/ios
   ```

> [!NOTE]
> Be sure to run `npx expo prebuild --clean` and not `yarn prebuild --clean` as there's an issue with path generation for ios/.xcode.env.local

4. Follow further instructions from README

### Developing

Run `./scripts/init.sh` in the main directory to install swift-format and set up
git hooks.

Follow further instructions for the SDK you're developing for.

### Releasing

Follow instructions from [RELEASE.md](./RELEASE.md)
The code should be released using our [release.yml](./.github/workflows/release.yml) Github Action.

This script will:

1. Fetch the dependencies
2. Run `expo-module prepare` to clean, configure and build source code, plugins etc. [See](https://github.com/expo/expo/tree/main/packages/expo-module-scripts) for more details
3. Publish to npm.

## Copyright and License

Copyright 2024, [Software Mansion](https://swmansion.com/?utm_source=git&utm_medium=readme&utm_campaign=react-client)

[![Software Mansion](https://logo.swmansion.com/logo?color=white&variant=desktop&width=200&tag=react-client)](https://swmansion.com/?utm_source=git&utm_medium=readme&utm_campaign=react-client)

Licensed under the [Apache License, Version 2.0](LICENSE)
