import { joinRoom, leaveRoom } from '../common/client';

import { ReceivableEvents } from './useFishjamEvent';
import RNFishjamClientModule from '../RNFishjamClientModule';
import { useFishjamEventState } from './useFishjamEventState';

type ReconnectionStatus = 'idle' | 'reconnecting' | 'error';
type PeerStatus = 'connecting' | 'connected' | 'error' | 'idle';

export type ConnectionStatus = ReconnectionStatus | PeerStatus;

function useConnectionStatus() {
  const peerStatus = useFishjamEventState<PeerStatus>(
    ReceivableEvents.PeerStatusChanged,
    RNFishjamClientModule.peerStatus,
  );

  const reconnectionStatus = useFishjamEventState<ReconnectionStatus>(
    ReceivableEvents.ReconnectionStatusChanged,
    RNFishjamClientModule.reconnectionStatus,
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
