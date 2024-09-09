# Fishjam iOS Client

[Fishjam](https://github.com/fishjam-dev/fishjam) Client library for iOS apps written in Swift.

## Components

The repository consists of 3 separate components:

- `FishjamClient` - Fishjam client fully compatible with `Fishjam`, responsible for exchanging media events and
  receiving media streams which then are presented to the user
- `FishjamClientDemo` - Demo application utilizing `Fishjam` client
- `MembraneRTC` - iOS WebRTC client

### Example App

Really simple App allowing to test `Fishjam client` functionalities. It consist of 2 screens:

- Joining screen where user passes peer token followed by join button click
- Room's screen consisting of set of control buttons and an area where participants' videos get displayed

## Documentation

API documentation is available [here](https://fishjam-cloud.github.io/mobile-client-sdk/modules/ios_client.html).

## Installation

Add FishjamClient dependency to your project.

## Developing

1. Run `./scripts/init.sh` in the main directory to install swift-format and release-it and set up git hooks
2. Edit `Debug.xcconfig` to set backend url in development.
3. Run `release-it` to release. Follow the prompts, it should update version in podspec, make a commit and tag and push
   the new version.

## Contributing

We welcome contributions to iOS Client SDK. Please report any bugs or issues you find or feel free to make a pull
request with your own bug fixes and/or features.

## Copyright and License

Copyright 2023, [Software Mansion](https://swmansion.com/?utm_source=git&utm_medium=readme&utm_campaign=fishjam)

[![Software Mansion](https://logo.swmansion.com/logo?color=white&variant=desktop&width=200&tag=membrane-github)](https://swmansion.com/?utm_source=git&utm_medium=readme&utm_campaign=fishjam)

Licensed under the [Apache License, Version 2.0](LICENSE)
