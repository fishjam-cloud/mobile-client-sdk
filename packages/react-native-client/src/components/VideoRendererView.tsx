import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';
import { ViewStyle } from 'react-native';

import { VideoLayout } from '../types';

export type VideoRendererProps = {
  /**
   * id of the video track which you want to render.
   */
  trackId: string;
  /**
   * Video layout inside of the component
   * @default `FILL`
   */
  videoLayout?: VideoLayout;
  /**
   * Whether the video should be rendered if it's off screen or hidden.
   */
  skipRenderOutsideVisibleArea?: boolean;
  style?: ViewStyle;
};

const NativeView: React.ComponentType<VideoRendererProps> =
  requireNativeViewManager('VideoRendererViewModule');

/**
 * Render video track received from {@link usePeers} hook
 * @category Components
 */
export const VideoRendererView = React.forwardRef<
  React.ComponentType<VideoRendererProps>,
  VideoRendererProps
>((props, ref) => (
  // @ts-expect-error ref prop needs to be updated
  <NativeView {...props} ref={ref} />
));
