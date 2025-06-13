# React Native Fishjam Video Player example

This example provides a minimal, working video player using Fishjam.

---

## Running the Example app

1.  Clone the repository:

    ```bash
    git clone [https://github.com/fishjam-cloud/mobile-client-sdk.git](https://github.com/fishjam-cloud/mobile-client-sdk.git)
    cd mobile-client-sdk
    ```

2.  Install dependencies and build project:

    ```bash
    yarn
    yarn build
    ```

3.  Prebuild native files in example directory:

    ```bash
    cd examples/video-player
    npx expo prebuild
    ```

    > [!NOTE]
    > Be sure to run `npx expo prebuild` and not `yarn prebuild` as there's an issue with path generation for the `ios/.xcode.env.local` file

4.  **Create a `.env` file** in the `examples/video-player` directory.

For a temporary live example, you can use:

```bash
EXPO_PUBLIC_BROADCASTER_URL=https://broadcaster.elixir-webrtc.org/api/whep
```

To obtain your own `BROADCASTER_URL`, you'll need to set up your own Fishjam Broadcaster instance. Refer to the Fishjam documentation for instructions on how to do this.

5.  Build app:

    ```bash
    yarn ios
    yarn android
    ```

---

## Testing

For testing, check out the [README](../webdriverio-test/readme.md) in the `webdriverio-test` directory.
