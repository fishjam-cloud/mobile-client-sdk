import RNFishjamClientModule, {
  ReceivableEvents,
} from '../RNFishjamClientModule';
import { useFishjamEventState } from './internal/useFishjamEventState';

type PeerStatus = 'connecting' | 'connected' | 'error' | 'idle';

/**
 * This hook provides live updates of current connection state of the local peer to a room (websocket state)
 * @returns Current peer status.
 * @deprecated
 * @ignore
 */
export const usePeerStatus = () => {
  const peerStatus = useFishjamEventState<PeerStatus>(
    ReceivableEvents.PeerStatusChanged,
    RNFishjamClientModule.peerStatus,
  );

  return { peerStatus };
};
