## E2E tests of Fishjam app

### How to run tests

1. [Install appium](https://appium.io/docs/en/2.1/quickstart/install/)
2. [Install UIAutomator2 (for android)](https://appium.io/docs/en/2.1/quickstart/uiauto2-driver/)
3. [Install XCUITest (for ios)](https://appium.github.io/appium-xcuitest-driver/5.11/setup/#real-devices)
4. [Don't forget about this (for ios)](https://appium.github.io/appium-xcuitest-driver/5.11/real-device-config/)
5. Run yarn install
6. Check file .env, there are some necessary env variables

- ANDROID_DEVICE_NAME - name of your android device, if not set test would not start on android can be checked using:
  adb devices -l
- ANDROID_APP_PATH - Path to .apk file on your computer, to generate it:

  - In folder example run: cd android && ./gradlew assembleRelease
  - Yor path should look like this your/path/to/repo/examples/fishjam-chat/android/app/build/outputs/apk/release/app-release.apk

- IOS_DEVICE_ID - id of your ios device, can be obtained using: xcrun xctrace list devices
- IOS_TEAM_ID - id of your team, can be obtained at apple developer page
- IOS_APP_PATH - Path to .ipa file on your computer, to generate it:
  - open example app in xcode, tap on product > archive
  - choose archive and tap on distribute > custom > development > next ... > automatically manage signing > export
  - choose file to export your app, recommend to do it in ios folder
  - your path should look like path/to/your/app/FishjamExample.ipa
- IOS_TEST_SCREEN_BROADCAST - indicates if ios screen broadcast should be tested

#### additional envs for github action

- FISHJAM_HOST_SERVER = `ip_address:port number` of the server
- FISHJAM_HOST_MOBILE = `ip_address:port_number` of the mobile phone

7. Run yarn install in webdriveio-test folder
8. [install wdio cli (Do not run npx wdio config, it is not necessary because it is already configured)](https://v6.webdriver.io/docs/clioptions.html)
9. Run fishjam ( if locally this command can be handy:

   docker run -p 50000-50050:50000-50050/udp \
   -p 5002:5002/tcp \
   -e FJ_CHECK_ORIGIN=false \
   -e FJ_HOST=localhost:5002 \
   -e FJ_PORT="5002" \
   -e FJ_WEBRTC_USED=true \
   -e FJ_WEBRTC_TURN_PORT_RANGE=50000-50050 \
   -e FJ_WEBRTC_TURN_IP=[ip address] \
   -e FJ_WEBRTC_TURN_LISTEN_IP=0.0.0.0 \
   -e FJ_SERVER_API_TOKEN=development \
   ghcr.io/fishjam-dev/fishjam:0.6.2

10. Run test in webdriveio-test folder : npx wdio wdio.conf.ts
