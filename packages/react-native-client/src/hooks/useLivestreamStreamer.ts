import { useCallback, useEffect, useRef } from 'react';
import {
  WhipClient,
  cameras,
  Camera,
  useWhipConnectionState,
  VideoParameters,
  SenderAudioCodecName,
  SenderVideoCodecName,
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
  disconnect: () => Promise<void>;
  /** Utility flag which indicates the current connection status */
  isConnected: boolean;
}

export interface useLivestreamStreamerParams {
  /**
   * Set the camera to use for the livestream.
   * Use {@link cameras} to get the list of supported cameras.
   */
  camera?: Camera;
  /**
   *  Set video parameters for the camera
   */
  videoParameters?: VideoParameters;
  /**
   * Set the preferred video codecs for sending the video.
   * Use {@link WhipClient.getSupportedVideoCodecs} to get the list of supported video codecs.
   */
  preferredVideoCodecs?: SenderVideoCodecName[];
  /**
   * Set the preferred audio codecs for sending the audio.
   * Use {@link WhipClient.getSupportedAudioCodecs} to get the list of supported audio codecs.
   */
  preferredAudioCodecs?: SenderAudioCodecName[];
}

/**
 * Hook for publishing a livestream, which can be then received with {@link useLivestreamViewer}
 * @category Livestream
 * @group Hooks
 */
export const useLivestreamStreamer = ({
  camera,
  videoParameters,
  preferredVideoCodecs,
  preferredAudioCodecs,
}: useLivestreamStreamerParams): useLivestreamStreamerResult => {
  const state = useWhipConnectionState();
  const isConnected = state === 'connected';

  const whipClient = useRef<WhipClient | null>(null);

  useEffect(() => {
    whipClient.current = new WhipClient(
      {
        audioEnabled: true,
        videoEnabled: true,
        videoParameters: videoParameters ?? VideoParameters.presetHD169,
        videoDeviceId: camera?.id ?? cameras[0].id,
      },
      preferredVideoCodecs,
      preferredAudioCodecs,
    );
    return () => {
      whipClient.current?.disconnect();
      whipClient.current?.cleanup();
    };
  }, [camera?.id, preferredAudioCodecs, preferredVideoCodecs, videoParameters]);

  const connect = useCallback(async (token: string, urlOverride?: string) => {
    const resolvedUrl = urlOverride ?? FISHJAM_WHIP_URL;
    await whipClient.current?.connect({
      authToken: token,
      serverUrl: resolvedUrl,
    });
  }, []);

  const disconnect = useCallback(async () => {
    await whipClient.current?.disconnect();
  }, []);

  return {
    connect,
    disconnect,
    isConnected,
  };
};
