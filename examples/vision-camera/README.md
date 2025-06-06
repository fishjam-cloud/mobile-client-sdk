# Fishjam Vision Camera example

This example demonstrates how to implement a CustomSource using [VisionCamera](https://github.com/mrousavy/react-native-vision-camera) to stream content directly from your device's camera to the Fishjam SDK.

For more information, consult our [documentation](https://docs.fishjam.io/react-native/custom-video-sources/vision-camera).

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
cd examples/vision-camera
npx expo prebuild
```

> [!IMPORTANT]
> Be sure to run `npx expo prebuild` and not `yarn prebuild` as there's an issue with path generation for the `ios/.xcode.env.local` file

4. Run the app:

`yarn ios`
or
`yarn android`
