# react-native-client

react-native-client is a React Native wrapper for
[android-client](https://github.com/fishjam-dev/android-client-sdk) and
[ios-client](https://github.com/fishjam-dev/ios-client-sdk). It allows you to
quickly and easily create a mobile client app in React Native for a
[Fishjam](https://github.com/fishjam-dev/fishjam) server.

# Documentation

API documentation is available
[here](https://fishjam-cloud.github.io/mobile-client-sdk/)

# Installation

Firstly install `react-native-client` with `yarn` or `npm`

```
yarn add @fishjam-cloud/react-native-client
```

or

```
npm install @fishjam-cloud/react-native-client
```

### Expo plugin

If you're using development builds with `eas build` or bare workflow you can try
using expo plugin to do the configuration below for you. Simply run:

```
expo install @fishjam-cloud/react-native-client
```

Add plugin to your `app.json` if it's not already added:

```json
{
  "expo": {
    "name": "example",
    ...
    "plugins": [
      "@fishjam-cloud/react-native-client"
    ]
  }
}
```

If you want to use screensharing feature, enable the following flag:

```json
{
  "expo": {
    "name": "example",
    ...
    "plugins": [
      [
        "@fishjam-cloud/react-native-client",
        {
          "setUpScreensharing": true,
        }
      ]
    ]
  }
}
```

On bare workflow run `expo prebuild` to configure the app, then run
`pod install`. On development build `eas build` should take care of it.

### Android

1. Add camera and microphone permissions to your `AndroidManifest.xml`.
2. Rebuild the app. That's it!

### iOS

On iOS installation is a bit more complicated, because you need to setup a
screen broadcast app extension for screensharing.

1. Add camera and microphone permissions to your main `Info.plist`.
   ```xml
   <key>NSCameraUsageDescription</key>
   <string>Allow $(PRODUCT_NAME) to use the camera</string>
   <key>NSMicrophoneUsageDescription</key>
   <string>Allow $(PRODUCT_NAME) to use the microphone</string>
   ```
2. We recommend adding `audio` background mode in `Info.plist` so that the app
   doesn't disconnect when it's in background:

```xml
  <key>UIBackgroundModes</key>
  <array>
    <string>audio</string>
  </array>
```

2. Open your `<your-project>.xcworkspace` in Xcode
3. Create new Broadcast Upload Extension. Select File → New → Target... →
   Broadcast Upload Extension → Next. Choose the name for the new target, select
   Swift language and deselect "Include UI Extension".

   ![New target config](./.github/images/xcode1.png)

   Press Finish. In the next alert xcode will ask you if you want to activate
   the new scheme - press Cancel.

4. Configure app group. Go to "Signing & Capabilities" tab, click "+ Capability"
   button in upper left corner and select "App Groups".

   ![App groups config](./.github/images/xcode2.png)

   Then in the "App Groups" add a new group or select existing. Usually group
   name has format `group.<your-bundle-identifier>`. Verify that both app and
   extension targets have app group and dev team set correctly.

5. A new folder with app extension should appear on the left with contents like
   this:

   ![App extension files](./.github/images/xcode3.png)

   Replace `SampleHandler.swift` with `MembraneBroadcastSampleHandler.swift` and
   this code:

   ```swift
   import Foundation
   import MembraneRTC
   import os.log
   import ReplayKit
   import WebRTC


   /// App Group used by the extension to exchange buffers with the target application
   let appGroup = "{{GROUP_IDENTIFIER}}"

   let logger = OSLog(subsystem: "{{BUNDLE_IDENTIFIER}}.MembraneBroadcastSampleHandler", category: "Broadcaster")

   /// An example `SampleHandler` utilizing `BroadcastSampleSource` from `MembraneRTC` sending broadcast samples and necessary notification enabling device's screencast.
   class MembraneBroadcastSampleHandler: RPBroadcastSampleHandler {
       let broadcastSource = BroadcastSampleSource(appGroup: appGroup)
       var started: Bool = false


       override func broadcastStarted(withSetupInfo _: [String: NSObject]?) {
           started = broadcastSource.connect()

           guard started else {
               os_log("failed to connect with ipc server", log: logger, type: .debug)

               super.finishBroadcastWithError(NSError(domain: "", code: 0, userInfo: nil))

               return
           }

           broadcastSource.started()
       }

       override func broadcastPaused() {
           broadcastSource.paused()
       }

       override func broadcastResumed() {
           broadcastSource.resumed()
       }

       override func broadcastFinished() {
           broadcastSource.finished()
       }

       override func processSampleBuffer(_ sampleBuffer: CMSampleBuffer, with sampleBufferType: RPSampleBufferType) {
           guard started else {
               return
           }

           broadcastSource.processFrame(sampleBuffer: sampleBuffer, ofType: sampleBufferType)
       }
   }
   ```

   Replace `{{GROUP_IDENTIFIER}}` and `{{BUNDLE_IDENTIFIER}}` with your group
   identifier and bundle identifier respectively.

6. In project's Podfile add the following code:
   ```rb
   target 'MembraneScreenBroadcastExtension' do
     pod 'MembraneRTC/Broadcast'
   end
   ```
   > This new dependency should be added outside of your application target.
   > Example
   >
   > ```rb
   > target 'ReactNativeMembraneExample' do
   >  ...
   > end
   >
   > target 'MembraneScreenBroadcastExtension' do
   >  pod 'MembraneRTC/Broadcast'
   > end
   > ```
7. Run `pod install` in your `ios/` directory
8. Add the following constants in your Info.plist:
   ```xml
   <key>AppGroupName</key>
   <string>{{GROUP_IDENTIFIER}}</string>
   <key>ScreencastExtensionBundleId</key>
   <string>{{BUNDLE_IDENTIFIER}}.MembraneBroadcastSampleHandler</string>
   ```
   Replace `{{GROUP_IDENTIFIER}}` and `{{BUNDLE_IDENTIFIER}}` with your group
   identifier and bundle identifier respectively.
9. Rebuild the app and enjoy!

# Example

We strongly recommend checking out our example app that implements a basic video
room client. To run the app:

1. Go to Membrane's server demo repo:
   https://github.com/fishjam-dev/fishjam-videoroom. Follow instructions there
   to setup and run demo server.
2. Clone the repo
3. ```
   cd example
   yarn
   ```
4. In App.ts replace server url with your server's url.
5. `yarn run android` or `yarn run ios` or run project from Android Studio /
   Xcode just like every RN project. Note that simulators won't work, you have
   to test on real device for camera and screensharing to run.

# Usage

> [!CAUTION] This part of documentation is out of date. It will be updated soon.

Connect to the server and join the room using the `connect` function. Use user
metadata to pass things like usernames etc. to the server.

```ts
const startServerConnection = () => {
  try {
    await connect('http://server_address:5002', 'peer_token', {
      displayName: 'Annie',
    });
  } catch (e) {
    console.log('error!');
  }
};
```

Remember to gracefully disconnect from the server using the `leaveRoom()`
function:

```ts
const stopServerConnection = () => {
  await leaveRoom();
};
```

Start the device's camera and microphone using `useCamera()` and
`useMicrophone()` hooks. Use `videoTrackMetadata` and `audioTrackMetadata`
options to send metadata about the tracks (for example whether it's a camera or
screencast track).

```ts
const { startCamera } = useCamera();
const { startMicrophone } = useMicrophone();

await startCamera({
  quality: VideoQuality.HD_169,
  videoTrackMetadata: { active: true, type: 'camera' },
});
await startMicrophone({ audioTrackMetadata: { active: true, type: 'audio' } });
```

For more options and functions to control the camera and microphone see the API
documentation.

If you have the connection set up, then use `useParticipants()` hook to track
the other participants in the room. One of the participants will be a local
participant (the one who's using the device). When participants is added or
removed because an user joins or leaves the room, the participants will be
updated automatically. Simply call the hook like this:

```ts
const participants = useParticipants();
```

When you have the participants all that's left is to render their video tracks.
Use `<VideoRendererView />` component like this:

```ts
{
  endpoint.videoTracks.map((track) => (
    <VideoRendererView trackId={track.id} />
  ));
}
```

You can style the views to lay out them however you'd like, basic animations
should work too.

There are also some simple hooks for toggling camera, microphone and
screensharing. Use them like this:

```ts
const { isCameraOn, toggleCamera } = useCameraState();
const { isMicrophoneOn, toggleMicrophone } = useMicrophoneState();
```

For screencasting use `useScreencast()` hook. The local endpoint will have a new
video track which you can render just like an ordinary video track with
<VideoRendererView />:

```ts
const { isScreencastOn, toggleScreencast } = useScreencast();
...
toggleScreencast({screencastMetadata: { displayName: "Annie's desktop" }});
```

Use track metadata to differentiate between video and screencast tracks.

### Android foreground service

In order for the call to continue running when app is in background, you need to
set up and start a foreground service. You can use a 3rd party library for this,
for example [notifee](https://notifee.app/).

In `AndroidManifest.xml` specify necessary permissions:

```xml
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_CAMERA" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
```

And add foreground service:

```xml
<application
...
>
  ...
  <service
    android:name="app.notifee.core.ForegroundService"
    android:foregroundServiceType="mediaProjection|camera|microphone" />
</application>
```

Then to start the foreground service:

```ts
import notifee, { AndroidImportance } from '@notifee/react-native';

const startForegroundService = async () => {
  if (Platform.OS === 'android') {
    const channelId = await notifee.createChannel({
      id: 'video_call',
      name: 'Video call',
      lights: false,
      vibration: false,
      importance: AndroidImportance.DEFAULT,
    });

    await notifee.displayNotification({
      title: 'Your video call is ongoing',
      body: 'Tap to return to the call.',
      android: {
        channelId,
        asForegroundService: true,
        ongoing: true,
        pressAction: {
          id: 'default',
        },
      },
    });
  }
};
```

Don't forget to also stop the service when the call has ended:

```ts
notifee.stopForegroundService();
```

Also add this code in your `index.js` to register the service:

```js
notifee.registerForegroundService((notification) => {
  return new Promise(() => {});
});
```

## Credits

This project has been built and is maintained thanks to the support from
[dscout](https://dscout.com/) and [Software Mansion](https://swmansion.com).

<img alt="dscout" height="100" src="./.github/images/dscout_logo.png"/>
<img alt="Software Mansion" src="https://logo.swmansion.com/logo?color=white&variant=desktop&width=150&tag=react-native-reanimated-github"/>
