import notifee, {
  AndroidImportance,
  AndroidColor,
  AndroidForegroundServiceType,
} from '@notifee/react-native';
import { useEffect } from 'react';
import { Platform } from 'react-native';

async function displayCallNotification() {
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

export async function displayScreencastNotification() {
  await notifee.displayNotification({
    title: 'Your video call is ongoing',
    body: 'Tap to return to the call.',
    id: 'video_notification',
    android: {
      channelId: 'video_call',
      asForegroundService: true,
      foregroundServiceTypes: [
        AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_CAMERA,
        AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MICROPHONE,
        AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION,
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

export function useForegroundService() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      displayCallNotification();
      return () => {
        notifee.stopForegroundService();
      };
    }
  }, []);

  return;
}
