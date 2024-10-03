import { useEffect } from 'react';
import RNFishjamClientModule from '../RNFishjamClientModule';

/**
 * useForegroundService
 *
 * A custom hook that manages the lifecycle of a foreground service on Android.
 *
 * @remark For Android 14 and above (API level 34+), a foreground service with MEDIA_PROJECTION
 * type is required for screen sharing to comply with Android privacy settings. However this service
 * can only be started once user has granted the permission.
 *
 * @remark
 * You must call `handleAndroidScreenSharePermission` prior to calling `switchMediaProjectionService`.
 *
 * See more at: @link https://developer.android.com/develop/background-work/services/fg-service-types#media-projection
 *
 * @param {Object} options - The options for the foreground service.
 * @param {boolean} options.enableCamera - Flag to enable or disable the camera service.
 * @param {boolean} options.enableMicrophone - Flag to enable or disable the microphone service.
 * @param {boolean} options.enableScreencast - Flag to enable or disable the screencast service.
 *
 * @example
 * const { switchMediaProjectionService } = useForegroundService({
 *   enableCamera: true,
 *   enableMicrophone: false,
 * });
 *
 * // To toggle screen sharing
 *  if ((await handleScreenSharePermission()) == 'granted') {
 *     await switchMediaProjectionService(true);
 *  }
 *
 */
export const useForegroundService = ({
  enableCamera,
  enableMicrophone,
  enableScreencast,
}: {
  enableCamera: boolean;
  enableMicrophone: boolean;
  enableScreencast: boolean;
}) => {
  useEffect(() => {
    RNFishjamClientModule.setForegroundServiceConfig({
      channelId: 'io.fishjam.example.fishjamchat.foregroundservice.channel',
      channelName: 'Fishjam Chat Notifications',
      notificationTitle: 'Your video call is ongoing',
      notificationContent: 'Tap to return to the call.',
      enableCamera,
      enableMicrophone,
      enableScreencast,
    });
    RNFishjamClientModule.startForegroundService();
  }, [enableCamera, enableMicrophone, enableScreencast]);

  useEffect(() => {
    return () => {
      RNFishjamClientModule.stopForegroundService();
    };
  }, []);
};
