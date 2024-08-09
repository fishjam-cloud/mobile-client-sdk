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
} as const;

export const eventEmitter = new EventEmitter(
  RNFishjamClientModule ?? NativeModulesProxy.RNFishjamClient,
);
