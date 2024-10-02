import { PermissionsAndroid, Platform } from 'react-native';
import RNFishjamClientModule from '../RNFishjamClientModule';
import { ForegroundServiceOptions } from '../types';

/**
    * Launches a foreground service on Android.
    * Does nothing on other platforms.
    * 
    * @remarks
    * You must have have the following permissions enabled before calling this function:
    * @example
    ```
     "android.permission.FOREGROUND_SERVICE"
     "android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION"
     "android.permission.FOREGROUND_SERVICE_CAMERA"
     "android.permission.FOREGROUND_SERVICE_MICROPHONE"
     "android.permission.POST_NOTIFICATIONS"
    *```
    * as well as FishjamForegroundService in your AndroidManifest:
    * @example
    ```
      <service android:name="io.fishjam.reactnative.FishjamForegroundService" />
    ```
    * @category Screenshare
    */
export const startForegroundService = async (
  options: ForegroundServiceOptions,
): Promise<void> => {
  if (Platform.OS !== 'android') {
    return;
  }
  try {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (result !== PermissionsAndroid.RESULTS.GRANTED) {
      console.warn(
        "Notifications permission not granted. User won't be able to see a the app is in background.",
      );
    }
  } catch (err) {
    console.warn(err);
  }

  await RNFishjamClientModule.startForegroundService(options);
};

/**
 * Stops previously launched Android foreground service.
 * @see {@link startForegroundService} for further information.
 *
 * Does nothing on other platforms.
 * @category Screenshare
 */
export const stopForegroundService = async () => {
  if (Platform.OS !== 'android') {
    return;
  }
  await RNFishjamClientModule.stopForegroundService();
};
