import { CSSProperties } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { WhipClientView } from 'react-native-whip-whep';

/**
 * Props of the LivestreamView component
 */
export type LivestreamStreamerProps = {
  /**
   * Styles of the LivestreamView component
   */
  style?: StyleProp<ViewStyle>;
};

/**
 * Renders a video player playing the livestream set up with {@link useLivestreamStreamer} hook.
 *
 * @category Components
 * @param {object} props
 * @param {object} props.style
 */
export const LivestreamStreamer = ({ style }: LivestreamStreamerProps) => (
  <WhipClientView style={style as CSSProperties} />
);
