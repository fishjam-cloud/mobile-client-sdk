import { useCallback, useEffect, useRef } from 'react';
import {
  WhipClient,
  cameras,
  Camera,
  useWhipConnectionState,
  VideoParameters,
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
  videoParameters,
}: {
  camera?: Camera;
  videoParameters?: VideoParameters;
}): useLivestreamStreamerResult => {
  const state = useWhipConnectionState();
  const isConnected = state === 'connected';

  const whipClient = useRef<WhipClient | null>(null);

  const createWhipClient = useCallback(() => {
    return new WhipClient({
      audioEnabled: true,
      videoEnabled: true,
      videoParameters: videoParameters ?? VideoParameters.presetHD169,
      videoDeviceId: camera?.id ?? cameras[0].id,
    });
  }, [camera?.id, videoParameters]);

  useEffect(() => {
    whipClient.current = createWhipClient();
  }, [createWhipClient]);

  useEffect(() => {
    return () => {
      whipClient.current?.disconnect();
    };
  }, []);

  const connect = useCallback(async (token: string, urlOverride?: string) => {
    const resolvedUrl = urlOverride ?? FISHJAM_WHIP_URL;
    await whipClient.current?.connect({
      authToken: token,
      serverUrl: resolvedUrl,
    });
  }, []);

  const disconnect = useCallback(() => {
    whipClient.current?.disconnect();
  }, []);

  return { connect, disconnect, isConnected };
};
