import { useCallback, useState } from 'react';
import { ReceivableEvents, useFishjamEvent } from './useFishjamEvent';
import RNFishjamClientModule from '../RNFishjamClientModule';

/**
 * Represents the possible statuses of a peer connection to a room (websocket state).
 *
 * idle - Peer is not connected, either never connected or successfully disconnected.
 * connecting - Peer is in the process of connecting.
 * connected - Peer has successfully connected.
 * error - There was an error in the connection process.
 */
export type PeerStatus = 'connecting' | 'connected' | 'error' | 'idle';

/**
 * This hook provides live updates of current connection state of the local peer to a room (websocket state)
 * @returns Current peer status.
 * @category Connection
 * @group Hooks
 */
export const usePeerStatus = () => {
  const [peerStatus, setPeerStatus] = useState(
    RNFishjamClientModule.peerStatus,
  );

  const onPeerStatusChanged = useCallback((status?: PeerStatus) => {
    status && setPeerStatus(status);
  }, []);

  useFishjamEvent(ReceivableEvents.PeerStatusChanged, onPeerStatusChanged);

  return { peerStatus };
};
