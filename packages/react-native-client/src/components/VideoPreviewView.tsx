import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';
import { ViewStyle } from 'react-native';

import { VideoLayout } from '../types';
import { CameraId } from '../hooks/useCamera';

export type VideoPreviewViewProps = {
  /**
   * `FILL` or `FIT` - it works just like RN Image component. `FILL` fills the whole view
   * with video and it may cut some parts of the video. `FIT` scales the video so the whole
   * video is visible, but it may leave some empty space in the view.
   * @default `FILL`
   */
  videoLayout?: VideoLayout;
  style?: ViewStyle;
  /**
   * Id of the camera used for preview. Get available cameras with `camerasList` property.
   * @default the first front camera
   */
  cameraId?: CameraId;
};

const NativeView: React.ComponentType<VideoPreviewViewProps> =
  requireNativeViewManager('VideoPreviewViewModule');

export const VideoPreviewView = React.forwardRef<
  React.ComponentType<VideoPreviewViewProps>,
  VideoPreviewViewProps
>((props, ref) => (
  // @ts-expect-error ref prop needs to be updated
  <NativeView {...props} captureDeviceId={props.cameraId} ref={ref} />
));
