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

    nativeModuleEventEmitter.addListener(
      ReceivableEvents.ParticipantStatusConnecting,
      ({ message }: { message: string }) => {
        console.log(ReceivableEvents.ParticipantStatusConnecting);
      },
    );

    nativeModuleEventEmitter.addListener(
      ReceivableEvents.ParticipantStatusConnected,
      ({ message }: { message: string }) => {
        console.log(ReceivableEvents.ParticipantStatusConnected);
      },
    );

    nativeModuleEventEmitter.addListener(
      ReceivableEvents.ParticipantStatusError,
      ({ message }: { message: string }) => {
        console.log(ReceivableEvents.ParticipantStatusError);
      },
    );

    nativeModuleEventEmitter.addListener(
      ReceivableEvents.ParticipantStatusDisconnected,
      ({ message }: { message: string }) => {
        console.log(ReceivableEvents.ParticipantStatusDisconnected);
      },
    );
  } catch (error) {
    console.error(`Failed to start warning listener: ${error?.message ?? ''}`);
  }
};
