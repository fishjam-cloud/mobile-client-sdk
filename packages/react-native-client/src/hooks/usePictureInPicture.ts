import { useCallback } from 'react';
import RNFishjamClientModule from '../RNFishjamClientModule';

export const usePictureInPicture = () => {
  const setPictureInPictureActiveTrackId = useCallback(
    async (trackId: string) => {
      await RNFishjamClientModule.setPictureInPictureActiveTrackId(trackId);
    },
    [],
  );

  const startPictureInPicture = useCallback(async () => {
    await RNFishjamClientModule.startPictureInPicture();
  }, []);

  const stopPictureInPicture = useCallback(async () => {
    await RNFishjamClientModule.stopPictureInPicture();
  }, []);

  const setupPictureInPicture = useCallback(
    async (config?: {
      startAutomatically: boolean;
      stopAutomatically: boolean;
      allowsCameraInBackground: boolean;
    }) => {
      await RNFishjamClientModule.setupPictureInPicture({
        startAutomatically: config?.startAutomatically,
        stopAutomatically: config?.stopAutomatically,
        allowsCameraInBackground: config?.allowsCameraInBackground,
      });
    },
    [],
  );

  const cleanupPictureInPicture = useCallback(async () => {
    await RNFishjamClientModule.cleanupPictureInPicture();
  }, []);

  return {
    setPictureInPictureActiveTrackId,
    startPictureInPicture,
    stopPictureInPicture,
    setupPictureInPicture,
    cleanupPictureInPicture,
  };
};
