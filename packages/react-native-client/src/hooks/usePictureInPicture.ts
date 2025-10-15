import { useCallback } from 'react';
import RNFishjamClientModule from '../RNFishjamClientModule';

/**
 * Hook for managing Picture-in-Picture functionality on iOS.
 *
 * @example
 * ```tsx
 * const { setPipActiveTrackId, startPictureInPicture, togglePictureInPicture } = usePictureInPicture();
 *
 * // Set which video track to display in PiP
 * useEffect(() => {
 *   const videoTrack = localPeer?.tracks.find(t => t.type === 'Video');
 *   if (videoTrack) {
 *     setPipActiveTrackId(videoTrack.id);
 *   }
 * }, [localPeer]);
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

  return {
    setPipActiveTrackId,
    startPictureInPicture,
    stopPictureInPicture,
    togglePictureInPicture,
  };
};
