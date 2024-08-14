import notifee, {
  AndroidImportance,
  AndroidColor,
  AndroidForegroundServiceType,
} from '@notifee/react-native';
import { useCallback } from 'react';
import { Platform } from 'react-native';

async function displayNotification() {
  if (Platform.OS === 'android') {
    const channelId = await notifee.createChannel({
      id: 'video_call',
      name: 'Video call',
      lights: false,
      vibration: false,
      importance: AndroidImportance.DEFAULT,
    });

    await notifee.displayNotification({
      title: 'Your video call is ongoing',
      body: 'Tap to return to the call.',
      id: 'video_notification',
      android: {
        channelId,
        asForegroundService: true,
        foregroundServiceTypes: [
          AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_CAMERA,
          AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MICROPHONE,
        ],
        ongoing: true,
        color: AndroidColor.BLUE,
        colorized: true,
        pressAction: {
          id: 'default',
        },
      },
    });
  }
}

export function useForegroundService() {
  const startForegroundService = useCallback(async () => {
    await displayNotification();
  }, []);

  return { startForegroundService };
}
