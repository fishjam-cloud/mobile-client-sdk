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
bundle install
bundle exec pod install --project-directory=ios
yarn ios
```

Make sure your code passes TypeScript and ESLint. Run the following (in root folder) to verify:

```sh
yarn tsc
yarn lint:check
```

To edit the React Native SDK's Swift files, open `examples/fishjam-chat/ios/FishjamExample.xcworkspace` in XCode
and find the source files at
`Pods > Development Pods > RNFishjamClient`
to edit the iOS native SDK find
`Pods > Development Pods > FishjamCloudClient`

To edit the React Native SDK's Kotlin files, open `examples/fishjam-chat/android` in Android studio and find the
source files at
`fishjam-cloud-react-native-client`
to edit the Android native SDK find
`fishjam-cloud-android-client`

### Commit message convention

We follow the
[conventional commits specification](https://www.conventionalcommits.org/en) for
our commit messages:

- `fix`: bug fixes, e.g. fix crash due to deprecated method.
- `feat`: new features, e.g. add new method to the module.
- `refactor`: code refactor, e.g. migrate from class components to hooks.
- `docs`: changes into documentation, e.g. add usage example for the module..
- `test`: adding or updating tests, e.g. add integration tests using detox.
- `chore`: tooling changes, e.g. change CI config.

Our pre-commit hooks verify that your commit message matches this format when
committing.

### Linting and tests

[ESLint](https://eslint.org/), [Prettier](https://prettier.io/),
[TypeScript](https://www.typescriptlang.org/)

We use [TypeScript](https://www.typescriptlang.org/) for type checking,
[ESLint](https://eslint.org/) with [Prettier](https://prettier.io/) for linting
and formatting the code, and [Jest](https://jestjs.io/) for testing.

Our pre-commit hooks verify that the linter and tests pass when committing.

### Publishing to npm

#### Releasing via GitHub Actions

To release a new version of the package, navigate to `Actions` >
`Release package` workflow and trigger it with the chosen release type. The
workflow will update the package version in `package.json`, release the package
to NPM, create a new git tag and a GitHub release.

#### Releasing manually

We use [release-it](https://github.com/release-it/release-it) to make it easier
to publish new versions manually. It handles common tasks like bumping version
based on semver, creating tags and releases etc.

To publish a new version, go to `packages/react-native-client` and run the following:

```sh
yarn release
```

### Sending a pull request

> **Working on your first pull request?** You can learn how from this _free_
> series:
> [How to Contribute to an Open Source Project on GitHub](https://app.egghead.io/playlists/how-to-contribute-to-an-open-source-project-on-github).

When you're sending a pull request:

- Prefer small pull requests focused on one change.
- Verify that linters and tests are passing.
- Review the documentation to make sure it looks good.
- Follow the pull request template when opening a pull request.
- For pull requests that change the API or implementation, discuss with
  maintainers first by opening an issue.
