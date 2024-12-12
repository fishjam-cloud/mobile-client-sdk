import { useEffect } from 'react';
import nativeModule, {
  ReceivableEvents,
  ReceivableEventPayloads,
} from '../../RNFishjamClientModule';

export function useFishjamEvent<T extends keyof typeof ReceivableEvents>(
  eventName: T,
  callback: (event: ReceivableEventPayloads[T]) => void,
) {
  useEffect(() => {
    const eventListener = nativeModule.addListener(eventName, (event) => {
      callback(event[eventName]);
    });
    return () => eventListener.remove();
  }, [callback, eventName]);
}
