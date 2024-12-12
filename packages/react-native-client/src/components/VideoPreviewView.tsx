import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';
import { ViewStyle } from 'react-native';

import { VideoLayout } from '../types';
import { CameraId } from '../hooks/useCamera';

export type VideoPreviewViewProps = {
  /**
   * Video layout inside of the component
   * @default `FILL`
   */
  videoLayout?: VideoLayout;
  style?: ViewStyle;
  /**
   * Id of the camera used for preview. Get available cameras with `cameras` property.
   * @default the first front camera
   */
  cameraId?: CameraId;
};

const NativeView: React.ComponentType<VideoPreviewViewProps> =
  requireNativeViewManager('VideoPreviewViewModule');

/**
 * Render camera preview.
 * Allows to display camera preview before streaming is started
 *
 *
 * @category Components
 */
export const VideoPreviewView = React.forwardRef<
  React.ComponentType<VideoPreviewViewProps>,
  VideoPreviewViewProps
>((props, ref) => (
  // @ts-expect-error ref prop needs to be updated
  <NativeView {...props} captureDeviceId={props.cameraId} ref={ref} />
));
