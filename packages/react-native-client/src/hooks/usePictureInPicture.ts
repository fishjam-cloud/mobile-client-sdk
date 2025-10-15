import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import RNFishjamClientModule from '../RNFishjamClientModule';

export const usePictureInPicture = ({
  iosCameraInBackground,
  autoStartPip = true,
  autoStopPip = true,
}: {
  iosCameraInBackground: boolean;
  autoStartPip?: boolean;
  autoStopPip?: boolean;
}) => {
  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }
    RNFishjamClientModule.setAllowsCameraWhileInPictureInPicture(
      iosCameraInBackground,
    );
  }, [iosCameraInBackground]);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }
    RNFishjamClientModule.setPictureInPictureAutoStart(autoStartPip);
  }, [autoStartPip]);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }
    RNFishjamClientModule.setPictureInPictureAutoStop(autoStopPip);
  }, [autoStopPip]);

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

  const togglePictureInPicture = useCallback(async () => {
    await RNFishjamClientModule.togglePictureInPicture();
  }, []);

  return {
    setPictureInPictureActiveTrackId,
    startPictureInPicture,
    stopPictureInPicture,
    togglePictureInPicture,
  };
};
