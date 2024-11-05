import { useCallback, useState } from 'react';
import { ReceivableEvents, useFishjamEvent } from './useFishjamEvent';

export type ReconnectionStatus = 'idle' | 'reconnecting' | 'error';

/**
 * Information about reconnection status.
 * Could be used to retrieve connection status, once user will be disconnected
 * @group Hooks
 * @category Connection
 * @deprecated
 */
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
