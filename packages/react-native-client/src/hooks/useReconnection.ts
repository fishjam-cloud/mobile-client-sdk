import { useCallback, useState } from 'react';
import { ReceivableEvents, useFishjamEvent } from './useFishjamEvent';

export type ReconnectionStatus = 'idle' | 'reconnecting' | 'error';

export function useReconnection() {
  const [reconnectionStatus, setReconnectionStatus] =
    useState<ReconnectionStatus>('idle');

  const setStatusIdle = useCallback(() => setReconnectionStatus('idle'), []);
  const setStatusReconnecting = useCallback(
    () => setReconnectionStatus('reconnecting'),
    [],
  );
  const setStatusError = useCallback(() => setReconnectionStatus('error'), []);

  useFishjamEvent(ReceivableEvents.Reconnected, setStatusIdle);
  useFishjamEvent(ReceivableEvents.ReconnectionStarted, setStatusReconnecting);
  useFishjamEvent(
    ReceivableEvents.ReconnectionRetriesLimitReached,
    setStatusError,
  );

  return { reconnectionStatus };
}
