import { useCallback } from 'react';
import {
  connectWhepClient,
  createWhepClient,
  disconnectWhepClient,
  useWhepConnectionState,
} from 'react-native-whip-whep';
import { FISHJAM_WHEP_URL } from '../consts';

export type ConnectViewerConfig =
  | { token: string; streamId?: never }
  | { streamId: string; token?: never };

const urlFromConfig = (config: ConnectViewerConfig) => {
  if (config.streamId) return `${FISHJAM_WHEP_URL}/${config.streamId}`;
  return FISHJAM_WHEP_URL;
};

/**
 * @category Livestream
 */
export interface useLivestreamViewerResult {
  /**
   * Callback to start receiving a livestream.
   * If the livestream is private, provide `token`.
   * If the livestream is public, provide `streamId`.
   */
  connect: (config: ConnectViewerConfig, url?: string) => Promise<void>;
  /** Disconnect from a stream previously connected to with {@link connect} */
  disconnect: () => void;
  /** Utility flag which indicates the current connection status */
  isConnected: boolean;
}

/**
 * Hook for receiving a published livestream.
 * @category Livestream
 * @group Hooks
 */
export const useLivestreamViewer = (): useLivestreamViewerResult => {
  const state = useWhepConnectionState();
  const isConnected = state === 'connected';

  const connect = useCallback(
    async (config: ConnectViewerConfig, url?: string) => {
      createWhepClient(url ?? urlFromConfig(config), {
        authToken: config.token,
      });
      await connectWhepClient();
    },
    [],
  );

  const disconnect = useCallback(() => {
    disconnectWhepClient();
  }, []);

  return { connect, disconnect, isConnected };
};
