import { joinRoom, leaveRoom } from '../common/client';

import { useCallback, useState } from 'react';
import { ReceivableEvents, useFishjamEvent } from './useFishjamEvent';
import RNFishjamClientModule from '../RNFishjamClientModule';

type ReconnectionStatus = 'idle' | 'reconnecting' | 'error';
type PeerStatus = 'connecting' | 'connected' | 'error' | 'idle';

function useConnectionStatus() {
  const [peerStatus, setPeerStatus] = useState(
    RNFishjamClientModule.peerStatus,
  );

  const [reconnectionStatus, setReconnectionStatus] =
    useState<ReconnectionStatus>('idle');

  const onPeerStatusChanged = useCallback((status?: PeerStatus) => {
    status && setPeerStatus(status);
  }, []);

  useFishjamEvent(ReceivableEvents.PeerStatusChanged, onPeerStatusChanged);

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

  return { peerStatus, reconnectionStatus };
}

export function useFishjamConnect() {
  const { peerStatus, reconnectionStatus } = useConnectionStatus();
  return { joinRoom, leaveRoom, peerStatus, reconnectionStatus };
}
