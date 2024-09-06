import { useEffect, useRef } from 'react';
import Toast from 'react-native-toast-message';
import {
  ReconnectionStatus,
  useReconnection,
} from '@fishjam-cloud/react-native-client';

export function useReconnectionToasts() {
  const prevStatus = useRef<ReconnectionStatus>('idle');
  const { reconnectionStatus } = useReconnection();

  useEffect(() => {
    if (prevStatus.current == reconnectionStatus) return;
    prevStatus.current = reconnectionStatus;
    if (reconnectionStatus == 'error') {
      Toast.show({
        text1: 'Failed to reconnect',
      });
    } else if (reconnectionStatus == 'reconnecting') {
      Toast.show({
        text1: 'Connection is broken, reconnecting...',
      });
    } else {
      Toast.show({
        text1: 'Connected succesfully',
      });
    }
  }, [reconnectionStatus]);
}
