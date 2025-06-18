import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';
import { StyleProp, ViewStyle } from 'react-native';

import { VideoLayout } from '../types';
import { CameraId } from '../hooks/useCamera';

export type VideoPreviewViewProps = {
  /**
   * Video layout inside of the component
   * @default `FILL`
   */
  videoLayout?: VideoLayout;

  style?: StyleProp<ViewStyle>;
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
 * @param {object} props
 * @param {string} props.cameraId
 */
export const VideoPreviewView = React.forwardRef<
  React.ComponentType<VideoPreviewViewProps>,
  VideoPreviewViewProps
>((props, ref) => (
  // @ts-expect-error ref prop needs to be updated
  <NativeView {...props} captureDeviceId={props.cameraId} ref={ref} />
));

VideoPreviewView.displayName = 'VideoPreviewView';
