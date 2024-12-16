import RNFishjamClientModule, {
  ReceivableEvents,
} from '../RNFishjamClientModule';
import { useFishjamEventState } from './internal/useFishjamEventState';

/**
 * Information about reconnection status.
 * Could be used to retrieve connection status, once user will be disconnected
 * @group Hooks
 * @deprecated
 * @ignore
 */
export function useReconnection() {
  const reconnectionStatus = useFishjamEventState(
    ReceivableEvents.ReconnectionStatusChanged,
    RNFishjamClientModule.reconnectionStatus,
  );

  return { reconnectionStatus };
}
