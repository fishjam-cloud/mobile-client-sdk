import { useCallback, useEffect, useState } from 'react';

import RNFishjamClientModule from '../RNFishjamClientModule';
import { ReceivableEvents, eventEmitter } from '../common/eventEmitter';

type IsMicrophoneOnEvent = { IsMicrophoneOn: boolean };

/**
 * This hook can toggle microphone on/off and provides current microphone state.
 */
export function useMicrophone() {
  const [isMicrophoneOn, setIsMicrophoneOn] = useState<boolean>(
    RNFishjamClientModule.isMicrophoneOn,
  );

  useEffect(() => {
    const eventListener = eventEmitter.addListener<IsMicrophoneOnEvent>(
      ReceivableEvents.IsMicrophoneOn,
      (event) => setIsMicrophoneOn(event.IsMicrophoneOn),
    );
    setIsMicrophoneOn(RNFishjamClientModule.isMicrophoneOn);
    return () => eventListener.remove();
  }, []);

  /**
   * Function to toggle microphone on/off
   */
  const toggleMicrophone = useCallback(async () => {
    const status = await RNFishjamClientModule.toggleMicrophone();
    await RNFishjamClientModule.updateAudioTrackMetadata({
      active: status,
      type: 'audio',
    });
    setIsMicrophoneOn(status);
  }, []);

  return { isMicrophoneOn, toggleMicrophone };
}
