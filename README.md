<img src="./.github/images/fishjam-card.png" width="100%" />

# Fishjam Mobile Client

> [!CAUTION]
> **This repository has been archived.**
>
> The mobile client SDK has been moved to the [web-client-sdk](https://github.com/fishjam-cloud/web-client-sdk) monorepo under [`packages/mobile-client`](https://github.com/fishjam-cloud/web-client-sdk/tree/main/packages/mobile-client).
>
> **Why?** The primary goal of this move was to keep the mobile React Native API in sync with the web React API. By housing both clients in a single monorepo, we can share code, align interfaces, and ensure a consistent developer experience across platforms.
>
> All future development, issues, and releases will happen in the new location. Please migrate to the new package.

---

<details>
<summary>Original README (for reference)</summary>

Monorepo containing mobile SDKs for [Fishjam](https://github.com/fishjam-dev/fishjam) server.

- [React Native](./packages/react-native-client/#readme)
- [Android Client](./packages/android-client/#readme)
- [iOS Client](./packages/ios-client/#readme)

> [!NOTE]
> Native SDK for Android and iOS do not have stable API. We strongly recommend using our React Native SDK

## Documentation

Our [official documentation](https://docs.fishjam.io/) on how [Fishjam](https://fishjam.io) works and how to integrate our service with your app.

## Example

You can run our Video Chat example app to see how it works. Source code and instruction on how to run it is available here.

## Developing

Run `./scripts/init.sh` in the main directory to install swift-format and set up
git hooks.

Follow further instructions for the SDK you're developing for.

While developing, use `internal/fishjam-chat` app for testing your changes. Follow instructions in the [README](./internal/fishjam-chat) for development setup.

## Releasing

Follow instructions from [RELEASE.md](./RELEASE.md).

The code should be released using our [release.yml](./.github/workflows/release.yml) Github Action.

## License

Licensed under the [Apache License, Version 2.0](LICENSE)

## Fishjam is created by Software Mansion

Since 2012 [Software Mansion](https://swmansion.com) is a software agency with experience in building web and mobile apps. We are Core React Native Contributors and experts in dealing with all kinds of React Native issues. We can help you build your next dream product – [Hire us](https://swmansion.com/contact/projects?utm_source=fishjam&utm_medium=mobile-readme).

[![Software Mansion](https://logo.swmansion.com/logo?color=white&variant=desktop&width=200&tag=react-client)](https://swmansion.com/contact/projects?utm_source=fishjam&utm_medium=mobile-readme)

</details>
