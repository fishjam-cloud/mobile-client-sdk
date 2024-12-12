import { useEffect } from 'react';
import nativeModule, {
  ReceivableEvents,
  ReceivableEventPayloads,
} from '../../RNFishjamClientModule';
import { isNativeEventPayloadValid } from '../../debug/internal/eventPayloadValidator';

export function useFishjamEvent<T extends keyof typeof ReceivableEvents>(
  eventName: T,
  callback: (event: ReceivableEventPayloads[T]) => void,
) {
  useEffect(() => {
    const eventListener = nativeModule.addListener(eventName, (event) => {
      const payload = event[eventName];

      if (__DEV__ && !isNativeEventPayloadValid(eventName, payload)) {
        if (process.env.CI) {
          ErrorUtils['reportFatalError'](
            new Error(`Invalid payload received for event ${eventName}`),
          );
        } else {
          console.error(
            `Invalid payload received for event ${eventName}:`,
            payload,
          );
        }
      }

      callback(payload);
    });
    return () => eventListener.remove();
  }, [callback, eventName]);
}
