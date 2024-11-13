import { useEffect } from 'react';
import {
  nativeModuleEventEmitter,
  ReceivableEvents,
} from '../RNFishjamClientModule';

export function useFishjamEvent<T>(
  eventName: keyof typeof ReceivableEvents,
  callback: (event: T) => void,
) {
  useEffect(() => {
    const eventListener = nativeModuleEventEmitter.addListener(
      eventName,
      (event) => {
        callback(event[eventName]);
      },
    );
    return () => eventListener.remove();
  }, [callback, eventName]);
}
