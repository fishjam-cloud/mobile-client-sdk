import { useCallback } from 'react';

import RNFishjamClientModule, {
  ReceivableEvents,
} from '../RNFishjamClientModule';
import { useFishjamEventState } from './useFishjamEventState';

/**
 * This hook can toggle microphone on/off and provides current microphone state.
 * @category Devices
 * @group Hooks
 */
export function useMicrophone() {
  const isMicrophoneOn = useFishjamEventState<boolean>(
    ReceivableEvents.IsMicrophoneOn,
    RNFishjamClientModule.isMicrophoneOn,
  );

  const toggleMicrophone = useCallback(async () => {
    await RNFishjamClientModule.toggleMicrophone();
  }, []);

  return {
    /** Informs if microphone is streaming audio */
    isMicrophoneOn,
    /** Function to toggle microphone on/off */
    toggleMicrophone,
  };
}
