import { useEffect } from 'react';
import {
  startForegroundService,
  stopForegroundService,
} from '../utils/foregroundService';
import { AndroidForegroundServiceType } from '../types';

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
  useEffect(() => {
    const foregroundTypes: AndroidForegroundServiceType[] = [];

    if (enableCamera) {
      foregroundTypes.push(
        AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_CAMERA,
      );
    }

    if (enableMicrophone) {
      foregroundTypes.push(
        AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MICROPHONE,
      );
    }

    startServiceWithTypes(foregroundTypes);
  }, [enableCamera, enableMicrophone]);

  useEffect(() => {
    return () => stopForegroundService();
  }, []);
};
