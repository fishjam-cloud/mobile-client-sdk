import { useEffect } from 'react';
import { nativeModuleEventEmitter } from '../RNFishjamClientModule';

export const ReceivableEvents = {
  IsMicrophoneOn: 'IsMicrophoneOn',
  IsScreenShareOn: 'IsScreenShareOn',
  IsAppScreenShareOn: 'IsAppScreenShareOn', // only for iOS
  SimulcastConfigUpdate: 'SimulcastConfigUpdate',
  PeersUpdate: 'PeersUpdate',
  AudioDeviceUpdate: 'AudioDeviceUpdate',
  SendMediaEvent: 'SendMediaEvent',
  BandwidthEstimation: 'BandwidthEstimation',
  Warning: 'Warning',
  PeerStatusChanged: 'PeerStatusChanged',
  ReconnectionStatusChanged: 'ReconnectionStatusChanged',
  CurrentCameraChanged: 'CurrentCameraChanged',
} as const;

export function useFishjamEvent<T>(
  eventName: keyof typeof ReceivableEvents,
  callback: (event: T) => void,
) {
  useEffect(() => {
    const eventListener = nativeModuleEventEmitter.addListener<
      Record<keyof typeof ReceivableEvents, T>
    >(eventName, (event) => {
      callback(event[eventName]);
    });
    return () => eventListener.remove();
  }, [callback, eventName]);
}
