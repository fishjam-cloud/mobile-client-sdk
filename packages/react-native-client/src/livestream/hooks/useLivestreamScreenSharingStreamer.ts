import { useCallback, useRef, useEffect } from 'react';
import {
  SenderAudioCodecName,
  SenderVideoCodecName,
  VideoParameters,
  WhipClientViewRef,
  useWhipConnectionState,
} from 'react-native-whip-whep';
import { FISHJAM_WHIP_URL } from '../../consts';

/**
 * @category Livestream
 */
export interface useLivestreamScreenSharingStreamerResult {
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
   * Reference to the WhipClient instance. Needs to be passed to the {@link LivestreamScreenSharingStreamer} component.
   */
  whipClientRef: React.RefObject<WhipClientViewRef | null>;
}

export type UseLivestreamScreenSharingStreamerParams = {
  /**
   * If audio track should be enabled.
   * Defaults to true.
   */
  audioEnabled?: boolean;
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
};

/**
 * Hook for publishing a screen sharing livestream, which can be then received with {@link useLivestreamViewer}
 * @category Livestream
 * @group Hooks
 */
export const useLivestreamScreenSharingStreamer = ({
  audioEnabled,
  videoParameters,
  preferredVideoCodecs,
  preferredAudioCodecs,
}: UseLivestreamScreenSharingStreamerParams = {}): useLivestreamScreenSharingStreamerResult => {
  const state = useWhipConnectionState();
  const isConnected = state === 'connected';

  const whipClientRef = useRef<WhipClientViewRef | null>(null);

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

  useEffect(() => {
    try {
      const initializeScreenShare = async () => {
        await whipClientRef.current?.initializeScreenShare({
          audioEnabled: audioEnabled ?? true,
          videoEnabled: true,
          videoParameters: videoParameters,
          preferredVideoCodecs: preferredVideoCodecs,
          preferredAudioCodecs: preferredAudioCodecs,
        });
      };
      initializeScreenShare();
    } catch (error) {
      console.error('Failed to initialize screen share:', error);
    }
    const ref = whipClientRef.current;
    return () => {
      ref?.disconnect();
    };
  }, [
    videoParameters,
    audioEnabled,
    preferredVideoCodecs,
    preferredAudioCodecs,
  ]);

  return {
    connect,
    disconnect,
    isConnected,
    whipClientRef,
  };
};
