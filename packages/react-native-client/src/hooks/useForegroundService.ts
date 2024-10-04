import { useEffect, useState } from 'react';
import RNFishjamClientModule from '../RNFishjamClientModule';
import {
  ForegroundServiceNotificationConfig,
  ForegroundServicePermissionsConfig,
} from '../types';
import { Platform } from 'react-native';

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
    RNFishjamClientModule.configureForegroundService(restOptions);
    setIsConfigured(true);
    return () => RNFishjamClientModule.stopForegroundService();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
