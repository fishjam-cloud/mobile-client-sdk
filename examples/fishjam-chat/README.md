# React Native Fishjam Cloud example

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
cd `examples/fishjam-chat`
npx expo prebuild
```

> [!NOTE]
> Be sure to run `npx expo prebuild` and not `yarn prebuild` as there's an issue with path generation for ios/.xcode.env.local

4. Build app:

```
yarn ios
yarn android
```

## Testing

For testing checkout [README](../webdriverio-test/readme.md) in `webdriverio-test` directory.
