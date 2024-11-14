import { ReceivableEvents } from './useFishjamEvent';
import RNFishjamClientModule from '../RNFishjamClientModule';
import { useFishjamEventState } from './useFishjamEventState';

export type ReconnectionStatus = 'idle' | 'reconnecting' | 'error';

/**
 * Information about reconnection status.
 * Could be used to retrieve connection status, once user will be disconnected
 * @group Hooks
 * @category Connection
 */
export function useReconnection() {
  const reconnectionStatus = useFishjamEventState<ReconnectionStatus>(
    ReceivableEvents.ReconnectionStatusChanged,
    RNFishjamClientModule.reconnectionStatus,
  );

  return { reconnectionStatus };
}
