import { useEffect, useState } from 'react';
import RNFishjamClientModule from '../RNFishjamClientModule';

import { PermissionsAndroid, Platform } from 'react-native';

export type ForegroundServiceConfigInternal = {
  enableCamera?: boolean;
  enableMicrophone?: boolean;
  enableScreenSharing?: boolean;
  channelId?: string;
  channelName?: string;
  notificationTitle?: string;
  notificationContent?: string;
};

/**
 * A type representing the configuration for foreground service permissions.
 *
 * @param enableCamera Indicates whether the camera is enabled for the foreground service.
 * @param enableMicrophone Indicates whether the microphone is enabled for the foreground service.
 * @param channelId The id of the channel. Must be unique per package.
 * @param channelName The user visible name of the channel.
 * @param notificationTitle The title (first row) of the notification, in a standard notification.
 * @param notificationContent The text (second row) of the notification, in a standard notification.
 *
 */
export type ForegroundServiceConfig = Omit<
  ForegroundServiceConfigInternal,
  'enableScreenSharing'
>;

const requestNotificationsPermission = async () => {
  try {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (result !== PermissionsAndroid.RESULTS.GRANTED) {
      console.warn(
        "Notifications permission not granted. User won't be able to see a the app is in background.",
      );
    }
  } catch (err) {
    console.warn(err);
  }
};

const useForegroundServiceAndroid = ({
  enableCamera,
  enableMicrophone,
  channelId,
  channelName,
  notificationContent,
  notificationTitle,
}: ForegroundServiceConfig) => {
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    if (!isConfigured) {
      return;
    }
    RNFishjamClientModule.startForegroundService({
      enableCamera,
      enableMicrophone,
      channelId,
      channelName,
      notificationContent,
      notificationTitle,
    });
  }, [
    channelId,
    channelName,
    enableCamera,
    enableMicrophone,
    isConfigured,
    notificationContent,
    notificationTitle,
  ]);

  useEffect(() => {
    const runConfiguration = async () => {
      await requestNotificationsPermission();
      setIsConfigured(true);
    };
    runConfiguration();
    return () => RNFishjamClientModule.stopForegroundService();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

const emptyFunction = () => {};

/**
 * useForegroundService
 *
 * A hook for managing a foreground service on Android. Does nothing on other platforms.
 * You can use this hook to keep your app running in the background. You're also required to run a foreground service when screen sharing.
 *
 * @param {Object} config - Configuration options for the foreground service.
 * @param {boolean} config.enableCamera - Flag to enable or disable camera usage in the foreground service. Only enable after the user has granted the necessary permissions.
 * @param {boolean} config.enableMicrophone - Flag to enable or disable microphone usage in the foreground service. Only enable after the user has granted the necessary permissions.
 * @param {Object} config.channelId - The id of the channel. Must be unique per package.
 * @param {Object} config.channelName - The user visible name of the channel.
 * @param {Object} config.notificationTitle - The title (first row) of the notification, in a standard notification.
 * @param {Object} config.notificationContent - The text (second row) of the notification, in a standard notification.
 *
 */
export const useForegroundService = Platform.select({
  android: useForegroundServiceAndroid,
  default: emptyFunction,
});
