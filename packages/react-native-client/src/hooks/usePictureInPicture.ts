import { useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import RNFishjamClientModule from '../RNFishjamClientModule';

/**
 * Hook for managing Picture-in-Picture functionality on iOS.
 *
 * @example
 * ```tsx
 * const {
 *   setPipActiveTrackId,
 *   startPictureInPicture,
 *   togglePictureInPicture,
 *   setAllowsCameraWhileInPictureInPicture,
 *   isCameraWhileInPictureInPictureSupported
 * } = usePictureInPicture();
 *
 * // Set which video track to display in PiP
 * useEffect(() => {
 *   const videoTrack = localPeer?.tracks.find(t => t.type === 'Video');
 *   if (videoTrack) {
 *     setPipActiveTrackId(videoTrack.id);
 *   }
 * }, [localPeer]);
 *
 * // Enable camera access while in PiP (iOS 16+ or iPad)
 * useEffect(() => {
 *   if (isCameraWhileInPictureInPictureSupported) {
 *     setAllowsCameraWhileInPictureInPicture(true);
 *   }
 * }, []);
 *
 * // PiP will start automatically when app goes to background if supportsPictureInPicture is enabled
 * // You can also manually control it:
 * <Button onPress={togglePictureInPicture} title="Toggle PiP" />
 * ```
 */
export const usePictureInPicture = () => {
  const setPipActiveTrackId = useCallback(async (trackId: string) => {
    await RNFishjamClientModule.setPipActiveTrackId(trackId);
  }, []);

  const startPictureInPicture = useCallback(async () => {
    await RNFishjamClientModule.startPictureInPicture();
  }, []);

  const stopPictureInPicture = useCallback(async () => {
    await RNFishjamClientModule.stopPictureInPicture();
  }, []);

  const togglePictureInPicture = useCallback(async () => {
    await RNFishjamClientModule.togglePictureInPicture();
  }, []);

  /**
   * Enable or disable camera access while in Picture-in-Picture mode.
   * This allows the camera to continue running while the app is in PiP mode or backgrounded.
   * This feature requires iOS 16.0 or later and device support.
   * If not supported, a warning will be emitted.
   *
   * @param enabled - Whether to allow camera access during PiP
   */
  const setAllowsCameraWhileInPictureInPicture = useCallback(
    async (enabled: boolean) => {
      if (Platform.OS !== 'ios') {
        console.warn(
          '[PictureInPicture] Background camera access is only available on iOS',
        );
        return;
      }
      await RNFishjamClientModule.setAllowsCameraWhileInPictureInPicture(
        enabled,
      );
    },
    [],
  );

  /**
   * Check if camera access while in Picture-in-Picture mode is supported.
   * This feature requires iOS 16.0 or later and device support.
   */
  const isCameraWhileInPictureInPictureSupported = useMemo(() => {
    if (Platform.OS !== 'ios') {
      return false;
    }
    return RNFishjamClientModule.isCameraWhileInPictureInPictureSupported();
  }, []);

  return {
    setPipActiveTrackId,
    startPictureInPicture,
    stopPictureInPicture,
    togglePictureInPicture,
    setAllowsCameraWhileInPictureInPicture,
    isCameraWhileInPictureInPictureSupported,
  };
};
