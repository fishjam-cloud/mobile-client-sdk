import { useCallback, useState } from 'react';
import { useFishjamEvent } from './useFishjamEvent';
import { EventPayloads, ReceivableEvents } from '../../RNFishjamClientModule';

export function useFishjamEventState<
  EventName extends keyof typeof ReceivableEvents,
  StateType = EventPayloads[EventName],
>(
  eventName: EventName,
  defaultValue: EventPayloads[EventName],
  transform?: (eventValue: EventPayloads[EventName]) => StateType,
) {
  const [value, setValue] = useState<StateType>(
    transform
      ? transform(defaultValue)
      : (defaultValue as unknown as StateType),
  );

  const onEvent = useCallback(
    (newValue: EventPayloads[EventName]) => {
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
