import { useCallback } from 'react';
import {
  ConnectionConfig,
  joinRoom as joinRoomClient,
  leaveRoom as leaveRoomClient,
} from '../common/client';

import RNFishjamClientModule, {
  ReceivableEvents,
} from '../RNFishjamClientModule';
import { useFishjamEventState } from './internal/useFishjamEventState';
import { GenericMetadata } from '../types';

/**
 * Represents the possible statuses of a peer while reconnecting to room
 *
 * - `idle` - No reconnection in progress. See {@link PeerStatus} for more details
 * - `reconnecting` - Peer is in the process of reconnecting.
 * - `error` - There was an error in the reconnection process.
 */
export type ReconnectionStatus = 'idle' | 'reconnecting' | 'error';

/**
 * Represents the possible statuses of a peer connection to a room (websocket state).
 *
 * - `idle` - Peer is not connected, either never connected or successfully disconnected.
 * - `connecting` - Peer is in the process of connecting.
 * - `connected` - Peer has successfully connected.
 * - `error` - There was an error in the connection process.
 */
export type PeerStatus = 'connecting' | 'connected' | 'error' | 'idle';

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
export type JoinRoomConfig<
  PeerMetadata extends GenericMetadata = GenericMetadata,
> = {
  /**
   * Fishjam URL
   */
  url: string;
  /**
   * Token received from server (or Room Manager)
   */
  peerToken: string;
  /**
   * String indexed record with metadata, that will be available to all other peers
   */
  peerMetadata?: PeerMetadata;
  /**
   *  Additional connection configuration
   */
  config?: ConnectionConfig;
};

/**
 * Connect/leave room. And get connection status.
 * @group Hooks
 * @category Connection
 */
export function useConnection() {
  const { peerStatus, reconnectionStatus } = useConnectionStatus();

  const joinRoom = useCallback(
    async <PeerMetadata extends GenericMetadata = GenericMetadata>({
      url,
      peerToken,
      peerMetadata,
      config,
    }: JoinRoomConfig<PeerMetadata>) => {
      await joinRoomClient(url, peerToken, peerMetadata, config);
    },
    [],
  );

  const leaveRoom = useCallback(() => {
    leaveRoomClient();
  }, []);

  return {
    /**
     * Join room and start streaming camera and microphone
     *
     * See {@link JoinRoomConfig} for parameter list
     */
    joinRoom,
    /**
     * Leave room and stop streaming
     * @type function
     */
    leaveRoom,
    peerStatus,
    reconnectionStatus,
  };
}
