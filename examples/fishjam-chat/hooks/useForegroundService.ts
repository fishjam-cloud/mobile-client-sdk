import {
  AndroidForegroundServiceType,
  startForegroundService,
  stopForegroundService,
} from '@fishjam-cloud/react-native-client';
import { useCallback, useEffect, useRef } from 'react';

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

export const useForegroundService = ({
  enableCamera,
  enableMicrophone,
}: {
  enableCamera: boolean;
  enableMicrophone: boolean;
}) => {
  const foregroundTypes = useRef<Set<AndroidForegroundServiceType>>(new Set());

  const refreshService = useCallback(async () => {
    if (foregroundTypes.current.size === 0) {
      stopForegroundService();
    } else {
      await startServiceWithTypes([...foregroundTypes.current]);
    }
  }, []);

  useEffect(() => {
    enableCamera
      ? foregroundTypes.current.add(
          AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_CAMERA,
        )
      : foregroundTypes.current.delete(
          AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_CAMERA,
        );

    enableMicrophone
      ? foregroundTypes.current.add(
          AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MICROPHONE,
        )
      : foregroundTypes.current.delete(
          AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MICROPHONE,
        );

    refreshService();
  }, [enableCamera, enableMicrophone, refreshService]);

  useEffect(() => {
    return () => stopForegroundService();
  }, []);

  const switchMediaProjectionService = useCallback(
    async ({ enable }: { enable: boolean }) => {
      enable
        ? foregroundTypes.current.add(
            AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION,
          )
        : foregroundTypes.current.delete(
            AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION,
          );

      await refreshService();
    },
    [refreshService],
  );

  return { switchMediaProjectionService };
};
