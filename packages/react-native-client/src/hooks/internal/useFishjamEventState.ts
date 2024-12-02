import { useCallback, useState } from 'react';
import { useFishjamEvent } from './useFishjamEvent';
import { ReceivableEvents } from '../../RNFishjamClientModule';

export function useFishjamEventState<EventType, StateType = EventType>(
  eventName: keyof typeof ReceivableEvents,
  defaultValue: StateType,
  transform?: (eventValue: EventType) => StateType,
) {
  const [value, setValue] = useState<StateType>(defaultValue);

  const onEvent = useCallback(
    (newValue: EventType) => {
      if (transform) {
        setValue(transform(newValue));
      } else {
        setValue(newValue as unknown as StateType);
      }
    },
    [transform],
  );

  useFishjamEvent(eventName, onEvent);

  return value;
}