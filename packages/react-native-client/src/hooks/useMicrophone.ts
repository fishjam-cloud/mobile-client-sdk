import { useCallback, useState } from 'react';

import RNFishjamClientModule from '../RNFishjamClientModule';
import { ReceivableEvents } from '../common/eventEmitter';
import { useFishjamEvent } from './useFishjamEvent';

type IsMicrophoneOnEvent = { IsMicrophoneOn: boolean };

/**
 * This hook can toggle microphone on/off and provides current microphone state.
 */
export function useMicrophone() {
  const [isMicrophoneOn, setIsMicrophoneOn] = useState<IsMicrophoneOnEvent>({
    IsMicrophoneOn: RNFishjamClientModule.isMicrophoneOn,
  });

  useFishjamEvent<IsMicrophoneOnEvent>(
    ReceivableEvents.IsMicrophoneOn,
    setIsMicrophoneOn,
  );

  /**
   * Function to toggle microphone on/off
   */
  const toggleMicrophone = useCallback(async () => {
    const status = await RNFishjamClientModule.toggleMicrophone();
    await RNFishjamClientModule.updateAudioTrackMetadata({
      active: status,
      type: 'audio',
    });
    setIsMicrophoneOn({ IsMicrophoneOn: status });
  }, []);

  return { isMicrophoneOn: isMicrophoneOn.IsMicrophoneOn, toggleMicrophone };
}
