# React Native Fishjam example

## Running the Example app

### Prerequisites

Create a `.env` file in the `examples/fishjam-chat` directory (optional), or copy the `.env.example` file. The following environment variables can be configured, but none of them are required:

- `EXPO_PUBLIC_FISHJAM_URL` - Pre-fills the Fishjam server URL in the "Connect with Token" tab
- `EXPO_PUBLIC_FISHJAM_PEER_TOKEN` - Pre-fills the peer token in the "Connect with Token" tab
- `EXPO_PUBLIC_ROOM_MANAGER_URL` - Pre-fills the Room Manager URL in the "Connect with Room Manager" tab
- `EXPO_PUBLIC_VIDEOROOM_STAGING_ROOM_MANAGER` - Room Manager URL for VideoRoom staging environment (enables the VideoRoom tab)
- `EXPO_PUBLIC_VIDEOROOM_PRODUCTION_ROOM_MANAGER` - Room Manager URL for VideoRoom production environment (enables the VideoRoom tab)

If you want to display the VideoRoom tab, both `EXPO_PUBLIC_VIDEOROOM_STAGING_ROOM_MANAGER` and `EXPO_PUBLIC_VIDEOROOM_PRODUCTION_ROOM_MANAGER` are required.

You can the example rooms using your own Fishjam account and a sandbox enviroment. Just go to https://fishjam.io/app/sandbox and copy your Room manager URL.

### Example Overview

The app has 5 tabs showing different ways to connect to Fishjam video calls:

**VideoRoom** - Connect to VideoRoom (Fishjam's demo service, something like Google Meet) by entering a room name and username. The app automatically creates the room and generates tokens for you. Only appears if you set the VideoRoom environment variables in `.env`.

**Use Room Manager** - Connect using any Room Manager service by providing the Room Manager URL, room name, and username. The Room Manager handles creating rooms and tokens automatically. Get Room Manager URLs from your Fishjam deployment or use public demo services. Checkout Fishjam docs to learn more about what Room Manager is.

**Livestream** - Join existing livestreams as a viewer by entering the livestream URL and viewer token. You'll need these from whoever is hosting the livestream - this is for watching only, not participating. Checkout Fishjam's livestreaming docs on how to start a stream.

**Use Token** - Direct connection using a Fishjam server URL and peer token. You need to manually create the room and generate tokens first using Fishjam's API or dashboard. This shows the lowest-level connection method, we use it for internal testing. You can skip this tab unless you're developing the SDK or running the intergration tests.

**Fishjam Room** - Demonstrates the pre-built `FishjamRoom` component that automatically connects to a test room. No inputs needed - just shows how to use the ready-made component in your own apps. If you open the tab on two different phones they should connect to each other.

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
npx expo prebuild --clean
```

> [!NOTE]
> Be sure to run `npx expo prebuild` and not `yarn prebuild` as there's an issue with path generation for the `ios/.xcode.env.local` file

4. Build app:

```
yarn ios
yarn android
```

## Testing

For testing checkout [README](../webdriverio-test/readme.md) in `webdriverio-test` directory.
