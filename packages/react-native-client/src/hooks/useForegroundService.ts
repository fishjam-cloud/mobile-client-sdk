import { useEffect } from 'react';
import RNFishjamClientModule from '../RNFishjamClientModule';
import { Platform } from 'react-native';
import { ForegroundServiceOptions } from '../types';

/**
 * Launches a foreground service on Android.
 * Does nothing on other platforms.
 */
export function useForegroundService(options: ForegroundServiceOptions) {
  useEffect(() => {
    if (Platform.OS === 'android') {
      RNFishjamClientModule.startForegroundService(options);
      return () => RNFishjamClientModule.stopForegroundService();
    }
    return () => {};
  }, [options]);
}
