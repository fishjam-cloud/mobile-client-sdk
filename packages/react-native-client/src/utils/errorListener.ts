import { ReceivableEvents } from '../hooks/useFishjamEvent';
import { nativeModuleEventEmitter } from '../RNFishjamClientModule';

export const initializeWarningListener = () => {
  if (__DEV__) {
    nativeModuleEventEmitter.addListener(
      ReceivableEvents.Warning,
      ({ message }: { message: string }) => {
        console.warn(message);
      },
    );
  }
};
