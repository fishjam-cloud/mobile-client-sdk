import { useCallback, useRef } from 'react';
import {
  connectWhepClient,
  createWhepClient,
  disconnectWhepClient,
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
}

/**
 * Hook for receiving a published livestream.
 * @category Livestream
 * @group Hooks
 */
export const useLivestreamViewer = (): useLivestreamViewerResult => {
  const isWhepClientCreatedRef = useRef(false);

  const connect = useCallback(
    async (config: ConnectViewerConfig, url?: string) => {
      createWhepClient(url ?? urlFromConfig(config), {
        authToken: config.token,
      });
      isWhepClientCreatedRef.current = true;
      await connectWhepClient();
    },
    [],
  );

  const disconnect = useCallback(() => {
    // TODO: Remove when FCE-1786 fixed
    if (isWhepClientCreatedRef.current) {
      disconnectWhepClient();
    }
  }, []);

  return { connect, disconnect };
};
