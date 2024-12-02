import { useEffect, useRef } from 'react';
import Toast from 'react-native-toast-message';
import {
  ReconnectionStatus,
  useConnection,
} from '@fishjam-cloud/react-native-client';

export function useReconnectionToasts() {
  const prevStatus = useRef<ReconnectionStatus>('idle');
  const { reconnectionStatus } = useConnection();

  useEffect(() => {
    if (prevStatus.current === reconnectionStatus) return;

    if (reconnectionStatus === 'reconnecting') {
      Toast.show({
        text1: 'Connection is broken, reconnecting...',
      });
    } else if (prevStatus.current === 'reconnecting') {
      if (reconnectionStatus === 'idle') {
        Toast.show({
          text1: 'Connected successfully',
        });
      } else if (reconnectionStatus === 'error') {
        Toast.show({
          text1: 'Failed to reconnect',
        });
      }
    }
    prevStatus.current = reconnectionStatus;
  }, [reconnectionStatus]);
}
