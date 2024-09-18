import { Platform } from 'react-native';
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
      <service android:name="io.fishjam.reactnative.FishjamForegroundService" android:foregroundServiceType="camera|microphone|mediaProjection"/>
    ```
    * @category Screenshare
    */
export const startForegroundService = (options: ForegroundServiceOptions) => {
  if (Platform.OS !== 'android') {
    return;
  }
  RNFishjamClientModule.startForegroundService(options);
};

/**
 * Stops previously launched Android foreground service.
 * @see {@link startForegroundService} for further information.
 *
 * Does nothing on other platforms.
 * @category Screenshare
 */
export const stopForegroundService = () => {
  if (Platform.OS !== 'android') {
    return;
  }
  RNFishjamClientModule.stopForegroundService();
};
