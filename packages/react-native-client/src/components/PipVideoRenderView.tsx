import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';
import { ViewProps } from 'react-native';

const NativeView: React.ComponentType = requireNativeViewManager<ViewProps>(
  'PipVideoRenderViewModule',
);

/**
 * Render video track received from {@link usePeers} hook
 *
 * Example usage:
 * ```js
 *  <VideoRendererView
 *      trackId={peer.cameraTrack?.id}
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
export const PipVideoRenderView = React.forwardRef<
  React.ComponentType<ViewProps>,
  ViewProps
>((props, ref) => (
  // @ts-expect-error ref prop needs to be updated
  <NativeView {...props} ref={ref} />
));

PipVideoRenderView.displayName = 'PipVideoRenderView';
