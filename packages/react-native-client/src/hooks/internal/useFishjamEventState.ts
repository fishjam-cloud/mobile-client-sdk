import { useCallback, useState } from 'react';
import { useFishjamEvent } from './useFishjamEvent';
import {
  ReceivableEventPayloads,
  ReceivableEvents,
} from '../../RNFishjamClientModule';

export function useFishjamEventState<
  EventName extends keyof typeof ReceivableEvents,
  StateType = ReceivableEventPayloads[EventName],
>(
  eventName: EventName,
  defaultValue: ReceivableEventPayloads[EventName],
  transform?: (eventValue: ReceivableEventPayloads[EventName]) => StateType,
) {
  const [value, setValue] = useState<StateType>(
    transform
      ? transform(defaultValue)
      : (defaultValue as unknown as StateType),
  );

  const onEvent = useCallback(
    (newValue: ReceivableEventPayloads[EventName]) => {
      if (transform) {
        setValue(transform(newValue));
      } else {
        setValue(newValue as unknown as StateType);
      }
    },
    [transform],
  );

  useFishjamEvent<EventName>(eventName, onEvent);

  return value;
}
