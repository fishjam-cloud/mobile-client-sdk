import { ReceivableEvents } from './useFishjamEvent';
import RNFishjamClientModule from '../RNFishjamClientModule';
import { useFishjamEventState } from './useFishjamEventState';

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
  const peerStatus = useFishjamEventState<PeerStatus>(
    ReceivableEvents.PeerStatusChanged,
    RNFishjamClientModule.peerStatus,
  );

  return { peerStatus };
};
