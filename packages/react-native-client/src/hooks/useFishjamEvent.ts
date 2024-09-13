import { useEffect } from 'react';
import { NativeModulesProxy, EventEmitter } from 'expo-modules-core';
import RNFishjamClientModule from '../RNFishjamClientModule';

export const ReceivableEvents = {
  IsCameraOn: 'IsCameraOn',
  IsMicrophoneOn: 'IsMicrophoneOn',
  IsScreencastOn: 'IsScreencastOn',
  SimulcastConfigUpdate: 'SimulcastConfigUpdate',
  PeersUpdate: 'PeersUpdate',
  AudioDeviceUpdate: 'AudioDeviceUpdate',
  SendMediaEvent: 'SendMediaEvent',
  BandwidthEstimation: 'BandwidthEstimation',
  ReconnectionRetriesLimitReached: 'ReconnectionRetriesLimitReached',
  ReconnectionStarted: 'ReconnectionStarted',
  Reconnected: 'Reconnected',
} as const;

const eventEmitter = new EventEmitter(
  RNFishjamClientModule ?? NativeModulesProxy.RNFishjamClient,
);

export function useFishjamEvent<T>(
  eventName: keyof typeof ReceivableEvents,
  callback: (event: T) => void,
) {
  useEffect(() => {
    const eventListener = eventEmitter.addListener<
      Record<keyof typeof ReceivableEvents, T>
    >(eventName, (event) => {
      callback(event[eventName]);
    });
    return () => eventListener.remove();
  }, [callback, eventName]);
}
