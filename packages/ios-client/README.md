# Fishjam iOS Client

[Fishjam](https://github.com/fishjam-dev/fishjam) Client library for iOS apps written in Swift.

> [!WARNING]  
> This SDK is not stable yet. We recommend to use
> [React Native Client](https://github.com/fishjam-cloud/mobile-client-sdk/tree/main/packages/react-native-client) for Fishjam
> services.

## Components

The repository consists of 3 separate components:

- `FishjamClient` - Fishjam client fully compatible with `Fishjam`, responsible for exchanging media events and
  receiving media streams which then are presented to the user
- `FishjamClientDemo` - Demo application utilizing `Fishjam` client
- `MembraneRTC` - iOS WebRTC client

## Installation

Add FishjamClient dependency to your project.

## Developing

1. Run `./scripts/init.sh` in the main directory to install swift-format and release-it and set up git hooks
2. Edit `Debug.xcconfig` to set backend url in development.

## Contributing

We welcome contributions to iOS Client SDK. Please report any bugs or issues you find or feel free to make a pull
request with your own bug fixes and/or features.

## License

Licensed under the [Apache License, Version 2.0](LICENSE)

## Fishjam is created by Software Mansion

Since 2012 [Software Mansion](https://swmansion.com) is a software agency with experience in building web and mobile apps. We are Core React Native Contributors and experts in dealing with all kinds of React Native issues. We can help you build your next dream product – [Hire us](https://swmansion.com/contact/projects?utm_source=fishjam&utm_medium=mobile-readme).

[![Software Mansion](https://logo.swmansion.com/logo?color=white&variant=desktop&width=200&tag=react-client)](https://swmansion.com/contact/projects?utm_source=fishjam&utm_medium=mobile-readme)
