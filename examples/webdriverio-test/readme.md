## E2E tests of Fishjam app

### How to run tests

1.  [Install Appium](https://appium.io/docs/en/2.1/quickstart/install/)
2.  [Install the UIAutomator2 driver (for Android)](https://appium.io/docs/en/2.1/quickstart/uiauto2-driver/)
3.  [Install the XCUITest driver (for iOS)](https://appium.github.io/appium-xcuitest-driver/5.11/setup/#real-devices)
4.  [Complete the required real device configuration for iOS](https://appium.github.io/appium-xcuitest-driver/5.11/real-device-config/)
5.  Run `yarn install` in the root directory.
6.  Check the `.env` file for the necessary environment variables:

    - `ANDROID_DEVICE_NAME` - The name of your Android device. Tests will not start on Android if this is not set. It can be found using:
      ```bash
      adb devices -l
      ```
    - `ANDROID_APP_PATH` - The absolute path to the `.apk` file on your computer. To generate it:

      - In the `example` folder, run: `cd android && ./gradlew assembleRelease`
      - Your path should look similar to this: `/path/to/repo/examples/fishjam-chat/android/app/build/outputs/apk/release/app-release.apk`
      - Alternatively, to generate a **debug** app using Expo:
        - Run `npx expo run:android`.
        - Choose the path to your installed app.
        - Ensure your Metro bundler is running by executing `npx expo start`.
        - Note: If the app is not connecting, you might need to run `adb reverse tcp:8081 tcp:8081` to allow communication between your device and the Metro bundler.

    - `IOS_DEVICE_ID` - The ID of your iOS device. It can be obtained using:
      ```bash
      xcrun xctrace list devices
      ```
    - `IOS_TEAM_ID` - Your team ID, which can be found on your Apple Developer page.
    - `IOS_APP_PATH` - The absolute path to the `.ipa` file on your computer. To generate it:

      - For a **release** app:
      - Open the example app in Xcode, then navigate to `Product > Archive`.
      - Choose the archive and click `Distribute App > Custom > Development`.
      - Proceed through the next steps, select "Automatically manage signing," and then export the app.
      - We recommend exporting the file into the `ios` folder.
      - Your path should look similar to this: `/path/to/your/app/FishjamExample.ipa`
      - Alternatively, to generate a **debug** app using Expo:
        - Run `npx expo run:ios`.
        - Choose the path to your installed app.
        - Ensure your Metro bundler is running by executing `npx expo start`.

    - `IOS_TEST_SCREEN_BROADCAST` - A flag to indicate if the iOS screen broadcast test should be run. The XCUITest driver is sometimes unable to tap the 'Start Broadcast' button. This behavior may depend on the OS version, software, hardware, or package versions.

    #### Additional environment variables for GitHub Actions

    - `FISHJAM_HOST_SERVER` = `ip_address:port_number` of the server.
    - `FISHJAM_HOST_MOBILE` = `ip_address:port_number` of the mobile phone.

7.  Run `yarn install` in the `webdriveio-test` folder.
8.  Log in to `ghcr.io`:

    ```bash
    docker login ghcr.io
    ```

    When prompted, use your GitHub username as the login and a Personal Access Token (PAT) as the password. To generate a token:

    - Go to your GitHub account.
    - Navigate to `Settings > Developer settings > Personal access tokens`.
    - Click “Generate new token” and make sure to select the appropriate scopes, such as `write:packages` and `read:packages`.

    For detailed instructions, refer to the official [GitHub documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens).

9.  Run Fishjam. For local execution, this command can be handy:

    ```bash
    docker run --platform linux/amd64 -p 50000-50050:50000-50050/udp -p 5002:5002/tcp -e FJ_CHECK_ORIGIN=false -e FJ_HOST=localhost:5002 -e FJ_PORT="5002" -e FJ_WEBRTC_USED=true -e FJ_WEBRTC_TURN_PORT_RANGE=50000-50050 -e FJ_WEBRTC_TURN_LISTEN_IP=0.0.0.0 -e FJ_SERVER_API_TOKEN=development ghcr.io/fishjam-cloud/fishjam:0.10.0-dev
    ```

10. Run the tests from the `webdriveio-test` folder:
    ```bash
    npx wdio wdio.conf.ts
    ```
