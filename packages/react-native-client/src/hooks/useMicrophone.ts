import { useCallback, useState } from 'react';

import RNFishjamClientModule from '../RNFishjamClientModule';
import { ReceivableEvents, useFishjamEvent } from './useFishjamEvent';

/**
 * This hook can toggle microphone on/off and provides current microphone state.
 * @category Devices
 * @group Hooks
 */
export function useMicrophone() {
  const [isMicrophoneOn, setIsMicrophoneOn] = useState<boolean>(
    RNFishjamClientModule.isMicrophoneOn,
  );

  useFishjamEvent(ReceivableEvents.IsMicrophoneOn, setIsMicrophoneOn);

  const toggleMicrophone = useCallback(async () => {
    const status = await RNFishjamClientModule.toggleMicrophone();
    await RNFishjamClientModule.updateAudioTrackMetadata({
      active: status,
      type: 'audio',
    });
    setIsMicrophoneOn(status);
  }, []);

  return {
    /** Informs if microhpone is streaming audio */
    isMicrophoneOn,
    /** Function to toggle microphone on/off */
    toggleMicrophone,
  };
}
