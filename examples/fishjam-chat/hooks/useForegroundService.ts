import {
  startForegroundService,
  stopForegroundService,
} from '@fishjam-cloud/react-native-client';
import { AndroidForegroundServiceType } from '@fishjam-cloud/react-native-client';
import { useEffect, useMemo } from 'react';

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
  const foregroundServiceTypes = useMemo(() => {
    const types: AndroidForegroundServiceType[] = [];
    if (enableCamera) {
      types.push(AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_CAMERA);
    }
    if (enableMicrophone) {
      types.push(
        AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MICROPHONE,
      );
    }
    return types;
  }, [enableCamera, enableMicrophone]);

  useEffect(() => {
    startServiceWithTypes([
      ...foregroundServiceTypes,
      AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION,
    ]);
    return () => stopForegroundService();
  }, [foregroundServiceTypes]);
};
