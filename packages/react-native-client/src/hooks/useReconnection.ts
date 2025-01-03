import RNFishjamClientModule, {
  ReceivableEvents,
} from '../RNFishjamClientModule';
import { useFishjamEventState } from './internal/useFishjamEventState';

type ReconnectionStatus = 'idle' | 'reconnecting' | 'error';

/**
 * Information about reconnection status.
 * Could be used to retrieve connection status, once user will be disconnected
 * @group Hooks
 * @deprecated
 * @ignore
 */
export function useReconnection() {
  const reconnectionStatus = useFishjamEventState<ReconnectionStatus>(
    ReceivableEvents.ReconnectionStatusChanged,
    RNFishjamClientModule.reconnectionStatus,
  );

  return { reconnectionStatus };
}
