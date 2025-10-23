import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';
import { ViewProps } from 'react-native';

export type PictureInPictureConfig = {
  startAutomatically?: boolean;
  stopAutomatically?: boolean;
  allowsCameraInBackground?: boolean;
  primaryPlaceholderText?: string;
  secondaryPlaceholderText?: string;
};

export interface PipContainerViewProps extends ViewProps {
  startAutomatically?: boolean;
  stopAutomatically?: boolean;
  allowsCameraInBackground?: boolean;
  primaryPlaceholderText?: string;
  secondaryPlaceholderText?: string;
}

export interface PipContainerViewRef {
  startPictureInPicture(): Promise<void>;
  stopPictureInPicture(): Promise<void>;
}

const NativeView: React.ComponentType<PipContainerViewProps> =
  requireNativeViewManager<PipContainerViewProps>('PipContainerViewModule');

/**
 * A view component for Picture-in-Picture functionality with split-screen layout.
 *
 * Automatically displays:
 * - Primary view (left): Local camera track or placeholder text
 * - Secondary view (right): Remote track with active VAD (voice activity) or placeholder text
 *
 * Use a ref to call methods on this component:
 * ```js
 * const pipRef = useRef<PipContainerViewRef>(null);
 *
 * // Start PiP manually (if startAutomatically is false)
 * await pipRef.current?.startPictureInPicture();
 *
 * // Stop PiP manually
 * await pipRef.current?.stopPictureInPicture();
 * ```
 *
 * @param startAutomatically - Whether to start PiP automatically when app goes to background (default: true)
 * @param stopAutomatically - Whether to stop PiP automatically when app comes to foreground (default: true)
 * @param allowsCameraInBackground - Whether to allow camera to continue running in PiP mode (default: false, iOS only)
 * @param primaryPlaceholderText - Text to display when local camera is unavailable (default: "No camera")
 * @param secondaryPlaceholderText - Text to display when no remote speaker is active (default: "No active speaker")
 *
 * @category Components
 */
export const PipContainerView = React.forwardRef<
  PipContainerViewRef,
  PipContainerViewProps
>((props, ref) => (
  // @ts-expect-error - Expo modules API typing doesn't match React's ref typing
  <NativeView {...props} ref={ref} />
));

PipContainerView.displayName = 'PipContainerView';
