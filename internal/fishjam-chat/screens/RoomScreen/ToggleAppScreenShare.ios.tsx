import React, { useCallback } from 'react';
import { roomScreenLabels } from '../../types/ComponentLabels';
import { InCallButton } from '../../components';
import { useAppScreenShare } from '@fishjam-cloud/react-native-client';

export const ToggleAppScreenButton = () => {
  const { toggleAppScreenShare, isAppScreenShareOn } = useAppScreenShare();

  const onPress = useCallback(async () => {
    await toggleAppScreenShare();
  }, [toggleAppScreenShare]);

  return (
    <InCallButton
      iconName={isAppScreenShareOn ? 'cellphone-screenshot' : 'cellphone-off'}
      onPress={onPress}
      accessibilityLabel={roomScreenLabels.APP_SCREEN_SHARE_BUTTON}
    />
  );
};
