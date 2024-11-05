import { joinRoom, leaveRoom } from '../common/client';

import { useCallback, useState } from 'react';
import { ReceivableEvents, useFishjamEvent } from './useFishjamEvent';
import RNFishjamClientModule from '../RNFishjamClientModule';

type ReconnectionStatus = 'idle' | 'reconnecting' | 'error';
type PeerStatus = 'connecting' | 'connected' | 'error' | 'idle';

export type ConnectionStatus = ReconnectionStatus | PeerStatus;

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

/**
 * Connect/leave room. And get connection status.
 * @group Hooks
 * @category Connection
 */
export function useFishjamConnect() {
  const { peerStatus, reconnectionStatus } = useConnectionStatus();

  const connectionStatus: ConnectionStatus =
    reconnectionStatus === 'idle' ? peerStatus : reconnectionStatus;

  return {
    /**
     * join room and start streaming camera and microphone
     * @param url fishjam Url
     * @param peerToken token received from server (or Room Manager)
     * @param peerMetadata string indexed record with metadata, that will be available to all other peers
     * @param config additional connection configuration
     */
    joinRoom,
    /**
     * Leave room and stop streaming
     */
    leaveRoom,
    connectionStatus,
  };
}
