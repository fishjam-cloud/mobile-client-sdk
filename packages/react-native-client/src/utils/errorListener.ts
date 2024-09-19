import { ReceivableEvents } from '../hooks/useFishjamEvent';
import { nativeModuleEventEmitter } from '../RNFishjamClientModule';

export const initializeWarningListener = () => {
  if (!__DEV__) {
    return;
  }
  try {
    nativeModuleEventEmitter.addListener(
      ReceivableEvents.Warning,
      ({ message }: { message: string }) => {
        console.warn(message);
      },
    );
  } catch (error) {
    console.error(`Failed to start warning listener: ${error?.message ?? ''}`);
  }
};
