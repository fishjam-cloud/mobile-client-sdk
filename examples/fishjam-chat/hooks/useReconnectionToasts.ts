import { useEffect, useRef } from 'react';
import Toast from 'react-native-toast-message';
import {
  ConnectionStatus,
  useFishjamConnect,
} from '@fishjam-cloud/react-native-client';

export function useReconnectionToasts() {
  const prevStatus = useRef<ConnectionStatus>('idle');
  const { connectionStatus } = useFishjamConnect();

  useEffect(() => {
    if (prevStatus.current === connectionStatus) return;

    if (connectionStatus === 'reconnecting') {
      Toast.show({
        text1: 'Connection is broken, reconnecting...',
      });
    } else if (prevStatus.current === 'reconnecting') {
      if (connectionStatus === 'connected') {
        Toast.show({
          text1: 'Connected successfully',
        });
      } else if (connectionStatus === 'error') {
        Toast.show({
          text1: 'Failed to reconnect',
        });
      }
    }
    prevStatus.current = connectionStatus;
  }, [connectionStatus]);
}
