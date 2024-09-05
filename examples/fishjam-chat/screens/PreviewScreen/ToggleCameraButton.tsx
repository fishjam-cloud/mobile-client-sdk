import React, { FC, useCallback } from 'react';

import { InCallButton } from '../../components';
import { previewScreenLabels } from '../../types/ComponentLabels.ts';
import {
  displayIosSimulatorCameraAlert,
  isIosSimulator,
} from '../../utils/deviceUtils.ts';

interface ToggleCameraButtonProps {
  toggleCamera: () => void;
  isCameraOn: boolean;
}

export const ToggleCameraButton: FC<ToggleCameraButtonProps> = ({
  toggleCamera,
  isCameraOn,
}) => {
  const { TOGGLE_CAMERA_BUTTON } = previewScreenLabels;

  const handleCameraTogglePress = useCallback(() => {
    if (isIosSimulator) {
      displayIosSimulatorCameraAlert();
      return;
    }
    toggleCamera();
  }, [toggleCamera]);

  return (
    <InCallButton
      iconName={isCameraOn ? 'camera' : 'camera-off'}
      onPress={handleCameraTogglePress}
      accessibilityLabel={TOGGLE_CAMERA_BUTTON}
    />
  );
};
