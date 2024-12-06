# Fishjam Android Client

Android client library for [Fishjam](https://github.com/fishjam-dev/fishjam).

> [!WARNING]
> This SDK is not stable yet. We recommend to use
> [React Native Client](https://github.com/fishjam-cloud/mobile-client-sdk/tree/main/packages/react-native-client) for Fishjam
> services.

## Installation

Add jitpack repo to your build.gradle:

```gradle
 allprojects {
  repositories {
   ...
   maven { url 'https://jitpack.io' }
  }
 }
```

Add the dependency:

```gradle
 dependencies {
   implementation 'com.github.fishjam-cloud:android-client-sdk:<<version>>'
 }
```

## Usage

Make sure you have:

- Running [Fishjam](https://fishjam.io) account.
- Created room and token of peer in that room. You can use [Room Manager](https://fishjam.io/app) from your account dashboard

## Development

1. Set `FISHJAM_SOCKET_URL` in `~/.gradle/gradle.properties` to your dev backend.
2. Run `ktlint` to format code (if missing, install it with `brew install ktlint`)

## Contributing

We welcome contributions to this SDK. Please report any bugs or issues you find or feel free to make a pull request with
your own bug fixes and/or features.`

## License

Licensed under the [Apache License, Version 2.0](LICENSE)

## Fishjam is created by Software Mansion

Since 2012 [Software Mansion](https://swmansion.com) is a software agency with experience in building web and mobile apps. We are Core React Native Contributors and experts in dealing with all kinds of React Native issues. We can help you build your next dream product – [Hire us](https://swmansion.com/contact/projects?utm_source=fishjam&utm_medium=mobile-readme).

[![Software Mansion](https://logo.swmansion.com/logo?color=white&variant=desktop&width=200&tag=react-client)](https://swmansion.com/contact/projects?utm_source=fishjam&utm_medium=mobile-readme)
