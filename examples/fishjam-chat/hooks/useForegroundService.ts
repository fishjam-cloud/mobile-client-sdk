import {
  startForegroundService,
  stopForegroundService,
} from '@fishjam-cloud/react-native-client';
import { AndroidForegroundServiceType } from '@fishjam-cloud/react-native-client/build/types';
import { useEffect } from 'react';

const startServiceWithTypes = (
  foregroundServiceTypes: AndroidForegroundServiceType[],
) => {
  startForegroundService({
    channelId: 'io.fishjam.example.fishjamchat.foregroundservice.channel',
    channelName: 'Fishjam Chat Notifications',
    notificationTitle: 'Your video call is ongoing',
    notificationContent: 'Tap to return to the call.',
    foregroundServiceTypes,
  });
};

export const useForegroundService = () => {
  useEffect(() => {
    startServiceWithTypes([
      AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_CAMERA,
      AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MICROPHONE,
    ]);
    return () => stopForegroundService();
  }, []);

  return {
    enableScreencastService: () =>
      startServiceWithTypes([
        AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_CAMERA,
        AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MICROPHONE,
        AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION,
      ]),
  };
};
