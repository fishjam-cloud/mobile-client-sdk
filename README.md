<img src="./.github/images/fishjam-card.png" width="100%">

# Fishjam Cloud Mobile Client

Monorepo containing mobile SDKs for [Fishjam](https://github.com/fishjam-dev/fishjam) server.

- [React Native](./packages/react-native-client/README.md)
- [Android Client](./packages/android-client/README.md)
- [iOS Client](./packages/ios-client/README.md)

> [!NOTE]
> Native SDK for Android and iOS do not have stable API. We strongly recommend using our React Native SDK

# Documentation

Our [official documentation](https://fishjam-cloud.github.io/documentation/) on how [Fishjam Cloud](https://fishjam.io) works and how to integrate our service with your app.

# Example

You can run our Video Chat example app to see how it works. Source code and instruction on how to run it is available here.

### Developing

Run `./scripts/init.sh` in the main directory to install swift-format and set up
git hooks.

Follow further instructions for the SDK you're developing for.

### Releasing

Follow instructions from [RELEASE.md](./RELEASE.md).

The code should be released using our [release.yml](./.github/workflows/release.yml) Github Action.

## Copyright and License

Copyright 2024, [Software Mansion](https://swmansion.com/?utm_source=git&utm_medium=readme&utm_campaign=react-client)

[![Software Mansion](https://logo.swmansion.com/logo?color=white&variant=desktop&width=200&tag=react-client)](https://swmansion.com/?utm_source=git&utm_medium=readme&utm_campaign=react-client)

Licensed under the [Apache License, Version 2.0](LICENSE)
