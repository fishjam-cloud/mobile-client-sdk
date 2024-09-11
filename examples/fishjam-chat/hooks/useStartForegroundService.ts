import {
  startForegroundService,
  stopForegroundService,
} from '@fishjam-cloud/react-native-client';
import { useEffect } from 'react';

export const useForegroundService = () => {
  useEffect(() => {
    startForegroundService({
      channelId: 'io.fishjam.example.fishjamchat.foregroundservice.channel',
      channelName: 'Fishjam Chat Notifications',
      notificationTitle: 'Your video call is ongoing',
      notificationContent: 'Tap to return to the call.',
    });

    return () => stopForegroundService();
  }, []);
};
