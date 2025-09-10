import { ZodError } from 'zod';
import { useEffect } from 'react';
import nativeModule, {
  ReceivableEvents,
  ReceivableEventPayloads,
} from '../../RNFishjamClientModule';
import { validateNativeEventPayload } from '../../utils/eventPayloadValidator';

export function useFishjamEvent<T extends keyof typeof ReceivableEvents>(
  eventName: T,
  callback: (event: ReceivableEventPayloads[T]) => void,
) {
  useEffect(() => {
    const eventListener = nativeModule.addListener(eventName, (event) => {
      const payload = event[eventName];

      if (__DEV__) {
        validateAndLogEventPayload(eventName, payload);
      }

      callback(payload);
    });
    return () => eventListener.remove();
  }, [callback, eventName]);
}

export function validateAndLogEventPayload<
  T extends keyof typeof ReceivableEvents,
>(eventName: T, payload: ReceivableEventPayloads[T]): void {
  // Double check just to make sure
  if (!__DEV__) return;

  if (!process.env.EXPO_PUBLIC_CHECK_EVENT_PAYLOAD) return;

  try {
    validateNativeEventPayload(eventName, payload);
  } catch (error) {
    if (error instanceof ZodError) {
      console.error(
        `Invalid payload received for event ${eventName}:\n`,
        error.errors
          .map((err) => `- ${err.path.join('.')}: ${err.message}`)
          .join('\n'),
        `\n Received:\n${JSON.stringify(payload, null, 2)}\n\n`,
      );
    } else {
      console.error(
        `Unexpected error validating payload for event ${eventName}:`,
        error,
      );
    }
  }
}
