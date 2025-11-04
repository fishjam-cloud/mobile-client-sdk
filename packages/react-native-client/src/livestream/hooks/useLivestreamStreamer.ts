import { useCallback, useRef, useEffect } from 'react';
import {
  Camera,
  cameras,
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
  /** Callback to flip camera */
  flipCamera: () => Promise<void>;
  /** Callback to switch camera to the one passed as arguement */
  switchCamera: (deviceId: string) => Promise<void>;
  /** Callback to get the id of camera which is used for streaming  */
  currentCameraDeviceId: () => Promise<string | undefined>;
  /** Utility flag which indicates the current connection status */
  isConnected: boolean;
  /**
   * Reference to the WhipClient instance. Needs to be passed to the {@link LivestreamStreamer} component.
   */
  whipClientRef: React.RefObject<WhipClientViewRef | null>;
}

export type UseLivestreamStreamerParams = {
  /**
   * If video track should be enabled.
   * Defaults to true.
   */
  videoEnabled?: boolean;
  /**
   * If audio track should be enabled.
   * Defaults to true.
   */
  audioEnabled?: boolean;
  /**
   * Camera to use for the livestream.
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
};

/**
 * Hook for publishing a livestream, which can be then received with {@link useLivestreamViewer}
 * @category Livestream
 * @group Hooks
 */
export const useLivestreamStreamer = ({
  videoEnabled,
  audioEnabled,
  camera,
  videoParameters,
  preferredVideoCodecs,
  preferredAudioCodecs,
}: UseLivestreamStreamerParams = {}): useLivestreamStreamerResult => {
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

  const flipCamera = useCallback(async () => {
    await whipClientRef.current?.flipCamera();
  }, []);

  const switchCamera = useCallback(async (deviceId: string) => {
    return await whipClientRef.current?.switchCamera(deviceId);
  }, []);

  const currentCameraDeviceId = useCallback(async () => {
    return await whipClientRef.current?.currentCameraDeviceId();
  }, []);

  useEffect(() => {
    try {
      const initializeCamera = async () => {
        await whipClientRef.current?.initializeCamera({
          audioEnabled: audioEnabled ?? true,
          videoEnabled: videoEnabled ?? true,
          videoDeviceId: camera?.id ?? cameras[0].id,
          videoParameters: videoParameters,
          preferredVideoCodecs: preferredVideoCodecs,
          preferredAudioCodecs: preferredAudioCodecs,
        });
      };
      initializeCamera();
    } catch {
      console.error('Failed to initialize camera');
    }
    const ref = whipClientRef.current;
    return () => {
      ref?.disconnect();
    };
  }, [
    camera,
    videoParameters,
    videoEnabled,
    audioEnabled,
    preferredVideoCodecs,
    preferredAudioCodecs,
    whipClientRef,
  ]);

  return {
    connect,
    disconnect,
    flipCamera,
    switchCamera,
    currentCameraDeviceId,
    isConnected,
    whipClientRef,
  };
};
