import { useCallback } from 'react';
import { ConnectionConfig, joinRoom, leaveRoom } from '../common/client';

import RNFishjamClientModule, {
  ReceivableEvents,
} from '../RNFishjamClientModule';
import { useFishjamEventState } from './internal/useFishjamEventState';
import { GenericMetadata } from '../types';

type ReconnectionStatus = 'idle' | 'reconnecting' | 'error';
type PeerStatus = 'connecting' | 'connected' | 'error' | 'idle';

export type ConnectionStatus = ReconnectionStatus | PeerStatus;

function useConnectionStatus() {
  const peerStatus = useFishjamEventState(
    ReceivableEvents.PeerStatusChanged,
    RNFishjamClientModule.peerStatus,
  );

  const reconnectionStatus = useFishjamEventState(
    ReceivableEvents.ReconnectionStatusChanged,
    RNFishjamClientModule.reconnectionStatus,
  );

  return { peerStatus, reconnectionStatus };
}
export interface JoinRoomConfig<
  PeerMetadata extends GenericMetadata = GenericMetadata,
> {
  /**
   * fishjam URL
   */
  url: string;
  /**
   * token received from server (or Room Manager)
   */
  peerToken: string;
  /**
   * string indexed record with metadata, that will be available to all other peers
   */
  peerMetadata?: PeerMetadata;
  /**
   *  additional connection configuration
   */
  config?: ConnectionConfig;
}

/**
 * Connect/leave room. And get connection status.
 * @group Hooks
 * @category Connection
 */
export function useConnection() {
  const { peerStatus, reconnectionStatus } = useConnectionStatus();

  const join = useCallback(
    async <PeerMetadata extends GenericMetadata = GenericMetadata>({
      url,
      peerToken,
      peerMetadata,
      config,
    }: JoinRoomConfig<PeerMetadata>) => {
      await joinRoom(url, peerToken, peerMetadata, config);
    },
    [],
  );

  return {
    /**
     * join room and start streaming camera and microphone
     */
    joinRoom: join,
    /**
     * Leave room and stop streaming
     */
    leaveRoom,
    peerStatus,
    reconnectionStatus,
  };
}
