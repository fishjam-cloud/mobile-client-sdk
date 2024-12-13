import { requireNativeModule } from 'expo-modules-core';

import type { NativeModule } from 'expo-modules-core/types';
import type { RTCStats } from './debug/stats/types';
import type { GenericMetadata, SimulcastConfig } from './types';
import type { CameraConfigInternal, Camera } from './hooks/useCamera';
import type { Peer } from './hooks/usePeers';
import type { ScreenShareOptionsInternal } from './hooks/useScreenShare';
import type { ConnectionConfig } from './common/client';
import { ForegroundServiceConfig } from './hooks/useForegroundService';
import { PeerStatus, ReconnectionStatus } from './hooks/useConnection';

type Metadata = { [key: string]: unknown };

type RNFishjamClient = {
  isMicrophoneOn: boolean;
  isCameraOn: boolean;
  isScreenShareOn: boolean;
  isAppScreenShareOn: boolean; // only available on ios
  cameras: ReadonlyArray<Camera>;
  currentCamera: Camera | null;
  peerStatus: PeerStatus;
  reconnectionStatus: ReconnectionStatus;

  getPeers: <
    PeerMetadataType extends Metadata,
    ServerMetadata extends Metadata = GenericMetadata,
  >() => Peer<PeerMetadataType, ServerMetadata>[];

  joinRoom: (
    url: string,
    peerToken: string,
    peerMetadata: Metadata,
    config: ConnectionConfig,
  ) => Promise<void>;
  leaveRoom: () => Promise<void>;
  startCamera: (config: CameraConfigInternal) => Promise<boolean>;
  toggleMicrophone: () => Promise<boolean>;
  toggleCamera: () => Promise<boolean>;
  flipCamera: () => Promise<void>;
  switchCamera: (cameraId: string) => Promise<void>;
  handleScreenSharePermission: () => Promise<'granted' | 'denied'>;
  toggleScreenShare: (
    screenShareOptions: Partial<ScreenShareOptionsInternal>,
  ) => Promise<void>;
  toggleAppScreenShare: (
    screenShareOptions: Partial<ScreenShareOptionsInternal>,
  ) => Promise<void>;
  updatePeerMetadata: <MetadataType extends Metadata>(
    metadata: MetadataType,
  ) => Promise<void>;
  updateVideoTrackMetadata: <MetadataType extends Metadata>(
    metadata: MetadataType,
  ) => Promise<void>;
  updateScreenShareTrackMetadata: <MetadataType extends Metadata>(
    metadata: MetadataType,
  ) => Promise<void>;
  setOutputAudioDevice: (audioDevice: string) => Promise<void>;
  startAudioSwitcher: () => Promise<void>;
  stopAudioSwitcher: () => Promise<void>;
  selectAudioSessionMode: (sessionMode: string) => Promise<void>;
  showAudioRoutePicker: () => Promise<void>;
  toggleScreenShareTrackEncoding: (
    encoding: string,
  ) => Promise<SimulcastConfig>;
  setScreenShareTrackBandwidth: (bandwidth: number) => Promise<void>;
  setScreenShareTrackEncodingBandwidth: (
    encoding: string,
    bandwidth: number,
  ) => Promise<void>;
  setTargetTrackEncoding: (trackId: string, encoding: string) => Promise<void>;
  toggleVideoTrackEncoding: (encoding: string) => Promise<SimulcastConfig>;
  setVideoTrackEncodingBandwidth: (
    encoding: string,
    bandwidth: number,
  ) => Promise<void>;
  setVideoTrackBandwidth: (bandwidth: number) => Promise<void>;
  changeWebRTCLoggingSeverity: (severity: string) => Promise<void>;
  getStatistics: () => Promise<RTCStats>;
  startForegroundService: (config: ForegroundServiceConfig) => Promise<void>;
  stopForegroundService: () => void;
};

export const ReceivableEvents = {
  IsMicrophoneOn: 'IsMicrophoneOn',
  IsScreenShareOn: 'IsScreenShareOn',
  IsAppScreenShareOn: 'IsAppScreenShareOn', // only for iOS
  SimulcastConfigUpdate: 'SimulcastConfigUpdate',
  PeersUpdate: 'PeersUpdate',
  AudioDeviceUpdate: 'AudioDeviceUpdate',
  SendMediaEvent: 'SendMediaEvent',
  BandwidthEstimation: 'BandwidthEstimation',
  ReconnectionRetriesLimitReached: 'ReconnectionRetriesLimitReached',
  ReconnectionStarted: 'ReconnectionStarted',
  Reconnected: 'Reconnected',
  Warning: 'Warning',
  PeerStatusChanged: 'PeerStatusChanged',
  ReconnectionStatusChanged: 'ReconnectionStatusChanged',
  CurrentCameraChanged: 'CurrentCameraChanged',
} as const;

export default requireNativeModule('RNFishjamClient') as RNFishjamClient &
  NativeModule<
    // TODO: Make event arguments typesafe instead of generic.
    Record<keyof typeof ReceivableEvents, <T>(...args: T[]) => void>
  >;
