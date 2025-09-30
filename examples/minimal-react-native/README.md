# Video Room Example

A fully functional video room demo built with [Fishjam Cloud](https://fishjam.io/), [Expo](https://expo.dev/), and [React Native](https://reactnative.dev/). This project demonstrates how to quickly integrate real-time video communication into your mobile app using the Fishjam Cloud React Native SDK.

## Features

- Join a video room with a custom room name and user name
- Real-time video grid with local and remote participants
- Automatic camera and microphone permission handling

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [Yarn](https://yarnpkg.com/) or [npm](https://www.npmjs.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/):
  ```sh
  npm install -g expo-cli
  # or
  yarn global add expo-cli
  ```

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/fishjam-cloud/mobile-client-sdk/tree/main
   cd mobile-client-sdk/examples/minimal-react-native
   ```
2. **Install dependencies:**
   ```sh
   yarn install
   ```
3. **Set up environment variables:**
   - Create a `.env` file in the root of the `minimal-react-native` directory:
     ```env
     EXPO_PUBLIC_FISHJAM_ID=
     ```
   - _You can obtain your Fishjam ID at [https://fishjam.io/app/](https://fishjam.io/app/)._

### Running the App

- **Start the Expo development server:**
  ```sh
  yarn start
  ```
- **Run on Android:**
  ```sh
  yarn android
  ```
- **Run on iOS:**
  ```sh
  yarn ios
  ```

## Usage

1. Enter a room name and your user name on the Home screen.
2. Tap **Connect** to join the video room.
3. See yourself and other participants in a responsive video grid.
4. Leaving the room or closing the app will disconnect you from the session.

## Architecture Overview

- **React Native + Expo**: Cross-platform mobile app framework.
- **Fishjam Cloud SDK**: Handles all real-time video, audio, and peer management.
- **TypeScript**: Provides type safety and better developer experience.

## Troubleshooting & FAQ

- **App fails to connect to a room:**
  - Ensure your `.env` file is present and `EXPO_PUBLIC_FISHJAM_ID` is set correctly.
  - Check your network connection.
  - Review logs in the Metro/Expo console for errors.
- **Camera or microphone not working:**
  - Make sure you have granted the necessary permissions on your device.

## License

This example is provided under the MIT License. See [LICENSE](../../LICENSE) for details.

---

_This project is maintained by the Fishjam team. For questions or support, visit [fishjam.io](https://fishjam.io/) or open an issue on GitHub._
