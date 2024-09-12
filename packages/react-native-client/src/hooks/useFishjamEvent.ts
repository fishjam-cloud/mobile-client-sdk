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

export function useFishjamEvent<Xd>(
  eventName: keyof typeof ReceivableEvents,
  callback: (event: Xd) => void,
) {
  useEffect(() => {
    const eventListener = eventEmitter.addListener<Xd>(eventName, callback);
    return () => eventListener.remove();
  }, [callback, eventName]);
}
