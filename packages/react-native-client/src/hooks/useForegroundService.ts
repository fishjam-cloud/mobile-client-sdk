import { useEffect } from 'react';
import RNFishjamClientModule from '../RNFishjamClientModule';
import { Platform } from 'react-native';

/**
 * This hook launches a foreground service on Android.
 * It does nothing on other platforms.
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
