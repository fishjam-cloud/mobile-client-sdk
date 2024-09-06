# Fishjam mobile-client-sdk

Monorepo containing mobile SDKs for [Fishjam](https://github.com/fishjam-dev/fishjam) server

- [android-client](./packages/android-client/README.md)
- [ios-client](./packages/ios-client/README.md)
- [react-native](./packages/react-native-client/README.md)

# Documentation

API documentation is available
[here](https://fishjam-cloud.github.io/mobile-client-sdk/)

# Example

We strongly recommend checking out our example app that implements a basic video
room client. To run the app:

1. Go to Membrane's server demo repo:
   https://github.com/fishjam-cloud/fishjam-videoroom. Follow instructions there
   to setup and run demo server.
2. Clone the repo
3. ```
   cd example
   yarn
   ```
4. Follow further instructions from your SDK

### Developing

Run `./scripts/init.sh` in the main directory to install swift-format and set up
git hooks.

Follow further instructions for the SDK you're developing for.

## Credits

This project has been built and is maintained thanks to the support from
[dscout](https://dscout.com/) and [Software Mansion](https://swmansion.com).

<img alt="dscout" height="100" src="./.github/images/dscout_logo.png"/>
<img alt="Software Mansion" src="https://logo.swmansion.com/logo?color=white&variant=desktop&width=150&tag=react-native-reanimated-github"/>
