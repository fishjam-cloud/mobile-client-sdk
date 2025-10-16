import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';
import { ViewProps } from 'react-native';

export type PictureInPictureConfig = {
  startAutomatically?: boolean;
  stopAutomatically?: boolean;
  allowsCameraInBackground?: boolean;
};

export interface PipVideoRenderViewProps extends ViewProps {
  startAutomatically?: boolean;
  stopAutomatically?: boolean;
  allowsCameraInBackground?: boolean;
}

export interface PipVideoRenderViewRef {
  setPictureInPictureActiveTrackId(trackId: string): Promise<void>;
  startPictureInPicture(): Promise<void>;
  stopPictureInPicture(): Promise<void>;
}

const NativeView: React.ComponentType<PipVideoRenderViewProps> =
  requireNativeViewManager<PipVideoRenderViewProps>('PipVideoRenderViewModule');

/**
 * A view component for Picture-in-Picture functionality.
 *
 * Use a ref to call methods on this component:
 * ```js
 * const pipRef = useRef<PipVideoRenderViewRef>(null);
 *
 * // Set active track
 * await pipRef.current?.setPictureInPictureActiveTrackId(trackId);
 *
 * // Start PiP manually (if startAutomatically is false)
 * await pipRef.current?.startPictureInPicture();
 * ```
 *
 * @param startAutomatically - Whether to start PiP automatically when app goes to background (default: true)
 * @param stopAutomatically - Whether to stop PiP automatically when app comes to foreground (default: true)
 * @param allowsCameraInBackground - Whether to allow camera to continue running in PiP mode (default: false)
 *
 * @category Components
 */
export const PipVideoRenderView = React.forwardRef<
  PipVideoRenderViewRef,
  PipVideoRenderViewProps
>((props, ref) => (
  // @ts-expect-error - Expo modules API typing doesn't match React's ref typing
  <NativeView {...props} ref={ref} />
));

PipVideoRenderView.displayName = 'PipVideoRenderView';
