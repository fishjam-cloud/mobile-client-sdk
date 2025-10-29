import { CSSProperties, Ref } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { WhepClientView, WhepClientViewRef } from 'react-native-whip-whep';

export type LivestreamViewerRef = WhepClientViewRef;

/**
 * Props of the LivestreamView component
 */
export type LivestreamViewerProps = {
  /**
   * Styles of the LivestreamView component
   */
  style?: StyleProp<ViewStyle>;
  /**
   * A variable deciding whether the Picture-in-Picture is enabled.
   * Defaults to true.
   */
  pipEnabled?: boolean;
  /**
   * A variable deciding whether the Picture-in-Picture mode should be started automatically after the app is backgrounded.
   * Defaults to false.
   */
  autoStartPip?: boolean;
  /**
   * A variable deciding whether the Picture-in-Picture mode should be stopped automatically on iOS after the app is foregrounded.
   * Always enabled on Android as PiP is not supported in foreground.
   * Defaults to false.
   */
  autoStopPip?: boolean;
  /**
   * A variable deciding the size of the Picture-in-Picture mode.
   */
  pipSize?: {
    width: number;
    height: number;
  };

  ref: Ref<LivestreamViewerRef>;
};

/**
 * Renders a video player playing the livestream set up with {@link useLivestreamViewer} hook.
 *
 * @category Components
 * @param {object} props
 * @param {object} props.style
 */
export const LivestreamViewer = ({
  style,
  pipEnabled,
  autoStartPip,
  autoStopPip,
  pipSize,
  ref,
}: LivestreamViewerProps) => (
  <WhepClientView
    ref={ref}
    style={style as CSSProperties}
    pipEnabled={pipEnabled}
    autoStartPip={autoStartPip}
    autoStopPip={autoStopPip}
    pipSize={pipSize}
  />
);
