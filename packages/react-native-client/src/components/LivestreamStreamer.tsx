import { CSSProperties, useEffect, useRef } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import {
  Camera,
  SenderAudioCodecName,
  SenderVideoCodecName,
  VideoParameters,
  WhipClient,
  WhipClientView,
} from 'react-native-whip-whep';

/**
 * Props of the LivestreamView component
 */
export type LivestreamStreamerProps = {
  /**
   * Styles of the LivestreamView component
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Set the video enabled flag.
   */
  videoEnabled?: boolean;
  /**
   * Set the audio enabled flag.
   */
  audioEnabled?: boolean;
  /**
   * Set the camera to use for the livestream.
   * Use {@link cameras} to get the list of supported cameras.
   */
  camera: Camera;
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

  /**
   * Reference to the WhipClient instance. Needs to be passed from the {@link useLivestreamStreamer} hook.
   */
  whipClientRef: React.RefObject<WhipClient | null>;
};

/**
 * Renders a video player playing the livestream set up with {@link useLivestreamStreamer} hook.
 *
 * @category Components
 * @param {object} props
 * @param {object} props.style
 */
export const LivestreamStreamer = ({
  style,
  whipClientRef,
  videoEnabled,
  audioEnabled,
  camera,
  videoParameters,
  preferredVideoCodecs,
  preferredAudioCodecs,
}: LivestreamStreamerProps) => {
  const whipClient = useRef<WhipClient | null>(null);

  useEffect(() => {
    whipClient.current = new WhipClient(
      {
        audioEnabled,
        videoEnabled,
        videoParameters,
        videoDeviceId: camera.id,
      },
      preferredVideoCodecs,
      preferredAudioCodecs,
    );
    whipClientRef.current = whipClient.current;

    return () => {
      whipClient.current?.disconnect();
      whipClient.current?.cleanup();
      whipClientRef.current = null;
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

  return <WhipClientView style={style as CSSProperties} />;
};
