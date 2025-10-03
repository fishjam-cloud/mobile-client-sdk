import { useCallback } from 'react';
import RNFishjamClientModule, {
  ReceivableEvents,
} from '../RNFishjamClientModule';
import { useFishjamEventState } from './internal/useFishjamEventState';
import { GenericMetadata } from '../types';
import { getFishjamUrl } from '../utils/getFishjamUrl';

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
export type JoinRoomConfig<
  PeerMetadata extends GenericMetadata = GenericMetadata,
> = {
  /**
   * Fishjam ID, which is used to connect to the room.
   * You can get it at https://fishjam.io/app
   */
  fishjamId: string;
  /**
   * Token received from server (or Room Manager)
   */
  peerToken: string;
  /**
   * String indexed record with metadata, that will be available to all other peers
   */
  peerMetadata?: PeerMetadata;
  /**
   * Additional connection configuration
   */
  config?: ConnectionConfig;
};

export type ConnectionConfig = {
  /**
   * Configuration for automatic reconnection
   * sdk uses a linear backoff algorithm, that is the formula
   * for the delay of the nth attempt is
   * n * delayMs + initialDelayMs
   *
   * Pass 0 for maxAttempts to disable automatic reconnection
   */
  reconnectConfig?: {
    maxAttempts?: number;
    initialDelayMs?: number;
    delayMs?: number;
  };
};

async function joinRoomClient<
  PeerMetadata extends GenericMetadata = GenericMetadata,
>(
  url: string,
  peerToken: string,
  peerMetadata?: PeerMetadata,
  config?: ConnectionConfig,
) {
  await RNFishjamClientModule.joinRoom(
    url,
    peerToken,
    peerMetadata ?? {},
    config ?? {},
  );
}

async function leaveRoomClient() {
  await RNFishjamClientModule.leaveRoom();
}

/**
 * Connect/leave room. And get connection status.
 * @group Hooks
 * @category Connection
 */
export function useConnection() {
  const { peerStatus, reconnectionStatus } = useConnectionStatus();

  const joinRoom = useCallback(
    async <PeerMetadata extends GenericMetadata = GenericMetadata>({
      peerToken,
      peerMetadata,
      config,
      fishjamId,
    }: JoinRoomConfig<PeerMetadata>) => {
      const connectUrl = getFishjamUrl(fishjamId);

      await joinRoomClient(connectUrl, peerToken, peerMetadata, config);
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
