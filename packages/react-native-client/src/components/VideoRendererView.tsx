import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';
import { ViewStyle, NativeSyntheticEvent } from 'react-native';

import { VideoLayout } from '../types';
import type { TrackId } from '../hooks/usePeers';

export type VideoRendererProps = {
  /**
   * id of the video track which you want to render.
   */
  trackId: TrackId;
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

  /**
   * Callback that is called when the dimensions of the underlying track change.
   */
  onDimensionsChanged?: (
    event: NativeSyntheticEvent<{
      dimensions: {
        width: number;
        height: number;
      };
    }>,
  ) => void;
};

const NativeView: React.ComponentType<VideoRendererProps> =
  requireNativeViewManager('VideoRendererViewModule');

/**
 * Render video track received from {@link usePeers} hook
 *
 * Example usage:
 * ```tsx
 *  <VideoRendererView
 *      trackId={peer.track.id}
 *      videoLayout="FIT"
 *      style={styles.videoContent}
 *  />
 *  ```
 *
 * @category Components
 *
 * @param {Object} props
 * @param props.trackId
 */
export const VideoRendererView = React.forwardRef<
  React.ComponentType<VideoRendererProps>,
  VideoRendererProps
>((props, ref) => (
  // @ts-expect-error ref prop needs to be updated
  <NativeView {...props} ref={ref} />
));
