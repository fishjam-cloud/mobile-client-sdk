import { useCallback, useRef } from 'react';
import {
  connectWhipClient,
  createWhipClient,
  disconnectWhipClient,
  cameras,
  Camera,
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
export const useLivestreamStreamer = ({
  camera,
}: {
  camera?: Camera;
}): useLivestreamStreamerResult => {
  const isWhipClientCreatedRef = useRef(false);

  const connect = useCallback(
    async (token: string, urlOverride?: string) => {
      if (isWhipClientCreatedRef.current) {
        return;
      }
      const resolvedUrl = urlOverride ?? FISHJAM_WHIP_URL;
      createWhipClient(
        resolvedUrl,
        {
          authToken: token,
        },
        camera?.id ?? cameras[0].id,
      );
      isWhipClientCreatedRef.current = true;
      await connectWhipClient();
    },
    [camera],
  );

  const disconnect = useCallback(() => {
    // TODO: Remove when FCE-1786 fixed
    if (isWhipClientCreatedRef.current) {
      disconnectWhipClient();
      isWhipClientCreatedRef.current = false;
    }
  }, []);

  return { connect, disconnect };
};
