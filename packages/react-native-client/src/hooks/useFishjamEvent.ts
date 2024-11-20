import { useEffect } from 'react';
import nativeModule, { ReceivableEvents } from '../RNFishjamClientModule';

export function useFishjamEvent<T>(
  eventName: keyof typeof ReceivableEvents,
  callback: (event: T) => void,
) {
  useEffect(() => {
    const eventListener = nativeModule.addListener(eventName, (event) => {
      callback(event[eventName]);
    });
    return () => eventListener.remove();
  }, [callback, eventName]);
}
