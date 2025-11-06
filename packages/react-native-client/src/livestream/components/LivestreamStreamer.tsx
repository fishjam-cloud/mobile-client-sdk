import { CSSProperties } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { WhipClientView, WhipClientViewRef } from 'react-native-whip-whep';

/**
 * Props of the LivestreamView component
 */
export type LivestreamStreamerProps = {
  /**
   * Styles of the LivestreamView component
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Reference to the WhipClient instance. Needs to be passed from the {@link useLivestreamStreamer} hook.
   */
  ref: React.RefObject<WhipClientViewRef | null>;
};

/**
 * Renders a video player playing the livestream set up with {@link useLivestreamStreamer} hook.
 *
 * @category Components
 * @param {object} props
 * @param {object} props.style
 */
export const LivestreamStreamer = ({ style, ref }: LivestreamStreamerProps) => {
  return <WhipClientView style={style as CSSProperties} ref={ref} />;
};
