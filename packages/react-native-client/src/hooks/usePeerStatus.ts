import { useCallback, useState } from 'react';
import { PeerStatus } from '../types';
import { ReceivableEvents, useFishjamEvent } from './useFishjamEvent';
import RNFishjamClientModule from '../RNFishjamClientModule';

/**
 * This hook provides live updates of current connection state of the local peer to a room (websocket state)
 * @returns Current peer status.
 * @category Connection
 * @group Hooks
 */
export const usePeerStatus = () => {
  const [peerStatus, setPeerStatus] = useState<PeerStatus>(
    RNFishjamClientModule.peerStatus,
  );

  const onPeerStatusChanged = useCallback((status?: PeerStatus) => {
    status && setPeerStatus(status);
  }, []);

  useFishjamEvent(ReceivableEvents.PeerStatusChanged, onPeerStatusChanged);

  return peerStatus;
};
