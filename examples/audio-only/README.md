# Fishjam Audio Only example

This example demonstrates how to implement an Audio Only room with Fishjam React Native SDK.

For more information, consult our [documentation](https://docs.fishjam.io/category/react-native-integration).

## Running the Example app

1. Clone the repository:

```
git clone https://github.com/fishjam-cloud/mobile-client-sdk.git
cd mobile-client-sdk
```

2. Install dependencies and build project:

```cmd
yarn
yarn build
```

3. Prebuild native files in example directory:

```cmd
cd examples/audio-only
npx expo prebuild
```

> [!NOTE]
> Be sure to run `npx expo prebuild` and not `yarn prebuild` as there's an issue with path generation for the `ios/.xcode.env.local` file

4. Run the app:

```
yarn ios
yarn android
```
