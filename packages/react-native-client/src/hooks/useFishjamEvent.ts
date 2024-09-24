import { useEffect } from 'react';
import { nativeModuleEventEmitter } from '../RNFishjamClientModule';

export const ReceivableEvents = {
  IsCameraOn: 'IsCameraOn',
  IsMicrophoneOn: 'IsMicrophoneOn',
  IsScreenShareOn: 'IsScreenShareOn',
  SimulcastConfigUpdate: 'SimulcastConfigUpdate',
  PeersUpdate: 'PeersUpdate',
  AudioDeviceUpdate: 'AudioDeviceUpdate',
  SendMediaEvent: 'SendMediaEvent',
  BandwidthEstimation: 'BandwidthEstimation',
  ReconnectionRetriesLimitReached: 'ReconnectionRetriesLimitReached',
  ReconnectionStarted: 'ReconnectionStarted',
  Reconnected: 'Reconnected',
  Warning: 'Warning',
  ParticipantStatusChanged: 'ParticipantStatusChanged',
} as const;

export function useFishjamEvent<T>(
  eventName: keyof typeof ReceivableEvents,
  callback: (event: T) => void,
) {
  useEffect(() => {
    const eventListener = nativeModuleEventEmitter.addListener<
      Record<keyof typeof ReceivableEvents, T>
    >(eventName, (event) => {
      console.log({ event: eventName });
      callback(event[eventName]);
    });
    return () => eventListener.remove();
  }, [callback, eventName]);
}
