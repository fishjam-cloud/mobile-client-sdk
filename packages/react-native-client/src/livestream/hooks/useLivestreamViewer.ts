import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useWhepConnectionState,
  WhepClientViewRef,
} from 'react-native-whip-whep';
import { FISHJAM_WHEP_URL } from '../../consts';

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
  disconnect: () => Promise<void>;
  /** Utility flag which indicates the current connection status */
  isConnected: boolean;
  /** Utility flag which indicates if whep client is connecting */
  isLoading: boolean;
  /**
   * Reference to the WhepClient instance. Needs to be passed to the {@link LivestreamViewer} component.
   */
  whepClientRef: React.RefObject<WhepClientViewRef | null>;
}

/**
 * Hook for receiving a published livestream.
 * @category Livestream
 * @group Hooks
 */
export const useLivestreamViewer = (): useLivestreamViewerResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const state = useWhepConnectionState();
  const isConnected = state === 'connected';

  const whepClientRef = useRef<WhepClientViewRef | null>(null);
  const isConnectingRef = useRef(false);

  useEffect(() => {
    const createClient = () => {
      whepClientRef.current?.createWhepClient({
        audioEnabled: true,
        videoEnabled: true,
      });
    };
    createClient();

    const ref = whepClientRef.current;
    return () => {
      ref?.disconnect();
      ref?.cleanup();
    };
  }, []);

  const connect = useCallback(
    async (config: ConnectViewerConfig, url?: string) => {
      if (isConnectingRef.current) {
        return;
      }

      isConnectingRef.current = true;
      setIsLoading(true);

      try {
        if (!isInitialized) {
          await whepClientRef.current?.createWhepClient({
            audioEnabled: true,
            videoEnabled: true,
          });
          setIsInitialized(true);
        }

        await whepClientRef.current?.connect({
          serverUrl: url ?? urlFromConfig(config),
          authToken: config.token,
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to connect to WHEP Client', error);
        setIsLoading(false);
      } finally {
        isConnectingRef.current = false;
      }
    },
    [isInitialized],
  );

  const disconnect = useCallback(async () => {
    await whepClientRef.current?.disconnect();
  }, []);

  return {
    connect,
    disconnect,
    whepClientRef,
    isConnected,
    isLoading,
  };
};
