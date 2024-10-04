import { useEffect, useState } from 'react';
import RNFishjamClientModule from '../RNFishjamClientModule';
import {
  ForegroundServiceNotificationConfig,
  ForegroundServicePermissionsConfig,
} from '../types';
import { PermissionsAndroid, Platform } from 'react-native';

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

export const useForegroundService = ({
  enableCamera,
  enableMicrophone,
  ...restOptions
}: ForegroundServiceNotificationConfig &
  ForegroundServicePermissionsConfig) => {
  /* eslint-disable react-hooks/rules-of-hooks */
  if (Platform.OS !== 'android') {
    return;
  }

  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    if (!isConfigured) {
      return;
    }
    RNFishjamClientModule.startForegroundService({
      enableCamera,
      enableMicrophone,
    });
  }, [enableCamera, enableMicrophone, isConfigured]);

  useEffect(() => {
    const runConfiguration = async () => {
      await requestNotificationsPermission();
      RNFishjamClientModule.configureForegroundService(restOptions);
      setIsConfigured(true);
    };
    runConfiguration();
    return () => RNFishjamClientModule.stopForegroundService();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
