import { useCallback, useRef } from 'react';
import {
  connectWhipClient,
  createWhipClient,
  disconnectWhipClient,
  cameras,
  Camera,
  useWhipConnectionState,
} from 'react-native-whip-whep';
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
  disconnect: () => void;
  /** Utility flag which indicates the current connection status */
  isConnected: boolean;
}

/**
 * Hook for publishing a livestream, which can be then received with {@link useLivestreamViewer}
 * @category Livestream
 * @group Hooks
 */
export const useLivestreamStreamer = ({
  camera,
}: {
  camera?: Camera;
}): useLivestreamStreamerResult => {
  const state = useWhipConnectionState();
  const isConnected = state === 'connected';

  const connect = useCallback(
    async (token: string, urlOverride?: string) => {
      const resolvedUrl = urlOverride ?? FISHJAM_WHIP_URL;
      createWhipClient(
        resolvedUrl,
        {
          authToken: token,
        },
        camera?.id ?? cameras[0].id,
      );
      await connectWhipClient();
    },
    [camera],
  );

  const disconnect = useCallback(() => {
    disconnectWhipClient();
  }, []);

  return { connect, disconnect, isConnected };
};
