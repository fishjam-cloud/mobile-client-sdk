# Contributing

We want this community to be friendly and respectful to each other. Please
follow it in all your interactions with the project.

## Development workflow

To get started with the project, run `yarn` in the root directory to install the
required dependencies for each package:

```sh
yarn
```

> While it's possible to use [`npm`](https://github.com/npm/cli), the tooling is
> built around [`yarn`](https://classic.yarnpkg.com/), so you'll have an easier
> time if you use `yarn` for development.

While developing, you can run the [example app](/examples/fishjam-chat) to test your changes.
Any changes you make in your library's JavaScript code will be reflected in the
example app without a rebuild. If you change any native code, then you'll need
to rebuild the example app.

Go into the example app:

```sh
cd examples/fishjam-chat
```

Prebuild the app:

```sh
npx expo prebuild
```

> [!NOTE]
> Be sure to run `npx expo prebuild` and not `yarn prebuild` as there's an issue with path generation for the `ios/.xcode.env.local` file

To start the packager:

```sh
yarn start
```

To run the example app on Android:

```sh
yarn android
```

To run the example app on iOS:

```sh
yarn ios
```

Make sure your code passes TypeScript and ESLint. Run the following (in root folder) to verify:

```sh
yarn tsc
yarn lint:check
```

To edit the React Native SDK's Swift files, open `examples/fishjam-chat/ios/FishjamExample.xcworkspace` in Xcode
and find the source files at
`Pods > Development Pods > RNFishjamClient`
to edit the iOS native SDK find
`Pods > Development Pods > FishjamCloudClient`

To edit the React Native SDK's Kotlin files, open `examples/fishjam-chat/android` in Android studio and find the
source files at
`fishjam-cloud-react-native-client`
to edit the Android native SDK find
`fishjam-cloud-android-client`

### Linting and tests

[ESLint](https://eslint.org/), [Prettier](https://prettier.io/),
[TypeScript](https://www.typescriptlang.org/)

We use [TypeScript](https://www.typescriptlang.org/) for type checking,
[ESLint](https://eslint.org/) with [Prettier](https://prettier.io/) for linting
and formatting the code, and [Jest](https://jestjs.io/) for testing.

### Sending a pull request

> **Working on your first pull request?** You can learn how from this _free_
> series:
> [How to Contribute to an Open Source Project on GitHub](https://app.egghead.io/playlists/how-to-contribute-to-an-open-source-project-on-github).

When you're sending a pull request:

- Prefer small pull requests focused on one change.
- Verify that linters and tests are passing.
- Run `npx expo-doctor` and make sure that your changes don't break any of it's checks.
- Review the documentation to make sure it looks good.
- Follow the pull request template when opening a pull request.
- For pull requests that change the API or implementation, discuss with
  maintainers first by opening an issue.
