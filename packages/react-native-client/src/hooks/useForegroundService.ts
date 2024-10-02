import { useCallback, useEffect, useRef } from 'react';
import {
  startForegroundService,
  stopForegroundService,
} from '../utils/foregroundService';
import { AndroidForegroundServiceType } from '../types';

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
}: {
  enableCamera: boolean;
  enableMicrophone: boolean;
}) => {
  const serviceTypesRef = useRef<Set<AndroidForegroundServiceType>>(new Set());

  const setServiceTypeEnabled = (
    serviceType: AndroidForegroundServiceType,
    enabled: boolean,
  ) => {
    if (enabled) {
      serviceTypesRef.current.add(serviceType);
    } else {
      serviceTypesRef.current.delete(serviceType);
    }
  };

  const refreshForegroundService = async () => {
    if (serviceTypesRef.current.size > 0) {
      console.log('Starting foreground service with types:', [
        ...serviceTypesRef.current,
      ]);
      await startServiceWithTypes([...serviceTypesRef.current]);
    } else {
      await stopForegroundService();
    }
  };

  useEffect(() => {
    setServiceTypeEnabled(
      AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_CAMERA,
      enableCamera,
    );
    setServiceTypeEnabled(
      AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MICROPHONE,
      enableMicrophone,
    );

    refreshForegroundService();
  }, [enableCamera, enableMicrophone]);

  useEffect(() => {
    return () => {
      stopForegroundService();
    };
  }, []);

  const switchScreenSharingForegroundService = useCallback(
    async ({ enabled }: { enabled: boolean }) => {
      setServiceTypeEnabled(
        AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION,
        enabled,
      );

      await refreshForegroundService();
    },
    [],
  );

  return { switchScreenSharingForegroundService };
};

const startServiceWithTypes = (
  foregroundServiceTypes: AndroidForegroundServiceType[],
) =>
  startForegroundService({
    channelId: 'io.fishjam.example.fishjamchat.foregroundservice.channel',
    channelName: 'Fishjam Chat Notifications',
    notificationTitle: 'Your video call is ongoing',
    notificationContent: 'Tap to return to the call.',
    foregroundServiceTypes,
  });
