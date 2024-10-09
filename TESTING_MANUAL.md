# Testing Audio

## Testing Audio Reception on Mobile

The easiest way to test whether audio is received on a mobile device is to stream something from the web app. To make it easier to listen, we'll use BlackHole, a virtual audio loopback driver, to stream audio into the input.

### Setup

1. Install BlackHole

   - Visit the [BlackHole GitHub page](https://github.com/ExistentialAudio/BlackHole?tab=readme-ov-file#installation-instructions) and follow the installation instructions.

2. Set up audio routing
   - Follow the [guide to route audio between applications](https://github.com/ExistentialAudio/BlackHole?tab=readme-ov-file#route-audio-between-applications).

### Testing Procedure

1. Connect through the web app to the same room as on the mobile device.
2. Select BlackHole as the audio input in the web app.
3. Play some music through BlackHole.
4. Check if the audio is playing on the mobile device.

## Testing Mobile Audio Input

### Setup

1. Use headphones as audio output on your computer to avoid feedback.

### Testing Procedure

1. Turn on the microphone on the mobile app.
2. Speak into the mobile device.
3. Check if the audio is streaming to the web app.

By following these steps, you can effectively test both audio reception and input on mobile devices.
