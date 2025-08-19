import { useCallback, useRef } from 'react';
import { useWhipConnectionState, WhipClient } from 'react-native-whip-whep';
import { FISHJAM_WHIP_URL } from '../consts';

/**
 * @category Livestream
 */
export interface useLivestreamStreamerResult {
  /**
   * Callback used to start publishing the selected audio and video media streams.
   *
   * @remarks
   * Calling {@link connect} multiple times will have the effect of only publishing the **last** specified inputs.
   */
  connect: (token: string, urlOverride?: string) => Promise<void>;
  /** Callback to stop publishing anything previously published with {@link connect} */
  disconnect: () => Promise<void>;
  /** Utility flag which indicates the current connection status */
  isConnected: boolean;
  /**
   * Reference to the WhipClient instance. Needs to be passed to the {@link LivestreamStreamer} component.
   */
  whipClientRef: React.RefObject<WhipClient | null>;
}

/**
 * Hook for publishing a livestream, which can be then received with {@link useLivestreamViewer}
 * @category Livestream
 * @group Hooks
 */
export const useLivestreamStreamer = (): useLivestreamStreamerResult => {
  const state = useWhipConnectionState();
  const isConnected = state === 'connected';

  const whipClientRef = useRef<WhipClient | null>(null);

  const connect = useCallback(async (token: string, urlOverride?: string) => {
    const resolvedUrl = urlOverride ?? FISHJAM_WHIP_URL;
    await whipClientRef.current?.connect({
      authToken: token,
      serverUrl: resolvedUrl,
    });
  }, []);

  const disconnect = useCallback(async () => {
    await whipClientRef.current?.disconnect();
  }, []);

  return {
    connect,
    disconnect,
    isConnected,
    whipClientRef,
  };
};
