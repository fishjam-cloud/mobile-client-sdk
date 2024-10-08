import React, { useCallback } from 'react';
import { roomScreenLabels } from '../../types/ComponentLabels';
import { InCallButton } from '../../components';
import { useAppScreenShare } from '@fishjam-cloud/react-native-client';

export const ToggleAppScreenButton = () => {
  const iosAppScreenShare = useAppScreenShare();

  const toggleAppScreenShare = useCallback(() => {
    iosAppScreenShare?.toggleAppScreenShare();
  }, [iosAppScreenShare]);

  return (
    <InCallButton
      iconName={
        iosAppScreenShare?.isAppScreenShareOn
          ? 'cellphone-screenshot'
          : 'cellphone-off'
      }
      onPress={toggleAppScreenShare}
      accessibilityLabel={roomScreenLabels.APP_SCREEN_SHARE_BUTTON}
    />
  );
};
