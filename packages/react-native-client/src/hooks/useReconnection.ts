import RNFishjamClientModule, {
  ReceivableEvents,
} from '../RNFishjamClientModule';
import { useFishjamEventState } from './internal/useFishjamEventState';

export type ReconnectionStatus = 'idle' | 'reconnecting' | 'error';

/**
 * Information about reconnection status.
 * Could be used to retrieve connection status, once user will be disconnected
 * @group Hooks
 * @deprecated
 */
export function useReconnection() {
  const reconnectionStatus = useFishjamEventState<ReconnectionStatus>(
    ReceivableEvents.ReconnectionStatusChanged,
    RNFishjamClientModule.reconnectionStatus,
  );

  return { reconnectionStatus };
}
