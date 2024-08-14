import { useEffect, useState } from 'react';
import { ReceivableEvents, eventEmitter } from '../common/eventEmitter';

export type ReconnectionStatus = 'idle' | 'reconnecting' | 'error';

export function useReconnection() {
  const [reconnectionStatus, setReconnectionStatus] =
    useState<ReconnectionStatus>('idle');

  useEffect(() => {
    const reconnectedEventListener = eventEmitter.addListener(
      ReceivableEvents.Reconnected,
      () => {
        setReconnectionStatus('idle');
      },
    );

    const reconnectionStartedEventListener = eventEmitter.addListener(
      ReceivableEvents.ReconnectionStarted,
      () => {
        setReconnectionStatus('reconnecting');
      },
    );

    const reconnectionRetriesLimitReachedEventListener =
      eventEmitter.addListener(
        ReceivableEvents.ReconnectionRetriesLimitReached,
        () => {
          setReconnectionStatus('error');
        },
      );

    return () => {
      reconnectedEventListener.remove();
      reconnectionStartedEventListener.remove();
      reconnectionRetriesLimitReachedEventListener.remove();
    };
  });

  return { reconnectionStatus };
}
