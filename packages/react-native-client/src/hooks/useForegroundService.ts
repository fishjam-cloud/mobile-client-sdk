import { useEffect } from 'react';
import RNFishjamClientModule from '../RNFishjamClientModule';
import { Platform } from 'react-native';

/**
 * Launches a foreground service on Android.
 * Does nothing on other platforms.
 */
export function useForegroundService() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      RNFishjamClientModule.startForegroundService();
      return () => RNFishjamClientModule.stopForegroundService();
    }
    return () => {};
  }, []);
}
