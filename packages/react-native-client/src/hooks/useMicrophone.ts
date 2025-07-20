import { useCallback } from 'react';
import RNFishjamClientModule, {
  ReceivableEvents,
} from '../RNFishjamClientModule';
import { useFishjamEventState } from './internal/useFishjamEventState';

/**
 * This hook can toggle microphone on/off and provides current microphone state.
 * @category Devices
 * @group Hooks
 */
export function useMicrophone() {
  const isMicrophoneOn = useFishjamEventState(
    ReceivableEvents.IsMicrophoneOn,
    RNFishjamClientModule.isMicrophoneOn,
  );

  const toggleMicrophone = useCallback(async () => {
    await RNFishjamClientModule.toggleMicrophone();
  }, []);

  const startMicrophone = useCallback(async () => {
    await RNFishjamClientModule.startMicrophone();
  }, []);

  const stopMicrophone = useCallback(async () => {
    await RNFishjamClientModule.stopMicrophone();
  }, []);

  return {
    /** Informs if microphone audio track is active */
    isMicrophoneOn,
    /** Toggles microphone on/off based on the value of `isMicrophoneOn` */
    toggleMicrophone,
    /** Starts microphone and requests permission if needed */
    startMicrophone,
    /** Stops microphone (mutes the track without removing it) */
    stopMicrophone,
  };
}
