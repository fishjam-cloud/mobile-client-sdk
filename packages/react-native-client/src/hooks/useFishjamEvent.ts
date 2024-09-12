import { useEffect } from 'react';
import { eventEmitter, ReceivableEvents } from '../common/eventEmitter';

export function useFishjamEvent<Xd>(
  eventName: keyof typeof ReceivableEvents,
  callback: (event: Xd) => void,
) {
  useEffect(() => {
    const eventListener = eventEmitter.addListener<Xd>(eventName, callback);
    return () => eventListener.remove();
  }, [callback, eventName]);
}
