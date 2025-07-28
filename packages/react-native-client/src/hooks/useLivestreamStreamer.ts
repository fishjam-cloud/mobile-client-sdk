import { useCallback, useRef } from 'react';
import {
  connectWhipClient,
  createWhipClient,
  disconnectWhipClient,
  cameras,
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
}

/**
 * Hook for publishing a livestream, which can be then received with {@link useLivestreamViewer}
 * @category Livestream
 * @group Hooks
 */
export const useLivestreamStreamer = (): useLivestreamStreamerResult => {
  const isWhipClientCreatedRef = useRef(false);

  const connect = useCallback(async (token: string, urlOverride?: string) => {
    const resolvedUrl = urlOverride ?? FISHJAM_WHIP_URL;
    console.log({ resolvedUrl, token });
    createWhipClient(
      resolvedUrl,
      {
        authToken: token,
      },
      cameras[0].id,
    );
    isWhipClientCreatedRef.current = true;
    await connectWhipClient();
  }, []);

  const disconnect = useCallback(() => {
    // TODO: Remove when FCE-1786 fixed
    if (isWhipClientCreatedRef.current) {
      disconnectWhipClient();
    }
  }, []);

  return { connect, disconnect };
};
