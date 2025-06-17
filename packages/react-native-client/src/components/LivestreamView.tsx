import { CSSProperties } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import {
  ReactNativeMobileWhepClientViewProps,
  WhepClientView,
} from 'react-native-whip-whep';

/**
 * Props of the LivestreamView component
 */
export type LivestreamViewProps = ReactNativeMobileWhepClientViewProps & {
  /**
   * Styles of the LivestreamView component
   */
  style?: StyleProp<ViewStyle>;
};

/**
 * Renders a video player playing the livestream set up with {@link useLivestream} hook.
 *
 * @category Components
 * @param {object} props
 * @param {object} props.style
 */
export const LivestreamView = ({ style }: LivestreamViewProps) => (
  <WhepClientView style={style as CSSProperties} />
);
