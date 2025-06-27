import { PermissionResponse, requireNativeModule } from 'expo-modules-core';

import type { NativeModule } from 'expo-modules-core/types';
import type { ConnectionConfig } from './common/client';
import type { RTCStats } from './debug/stats/types';
import type { OnAudioDeviceEvent } from './hooks/useAudioSettings';
import type {
  Camera,
  CameraConfigInternal,
  CurrentCameraChangedType,
} from './hooks/useCamera';
import type { PeerStatus, ReconnectionStatus } from './hooks/useConnection';
import type { ForegroundServiceConfig } from './hooks/useForegroundService';
import type { Peer } from './hooks/usePeers';
import type { ScreenShareOptionsInternal } from './hooks/useScreenShare';
import type { GenericMetadata, SimulcastConfig } from './types';

type Metadata = { [key: string]: unknown };

type RNFishjamClient = {
  isMicrophoneOn: boolean;
  isCameraOn: boolean;
  isScreenShareOn: boolean;
  isAppScreenShareOn: boolean; // only available on ios
  cameras: readonly Camera[];
  currentCamera: Camera | null;
  peerStatus: PeerStatus;
  reconnectionStatus: ReconnectionStatus;
  isCameraInitialized: boolean;

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
  getCameraPermissionsAsync: () => Promise<PermissionResponse>;
  requestCameraPermissionsAsync: () => Promise<PermissionResponse>;
  getMicrophonePermissionsAsync: () => Promise<PermissionResponse>;
  requestMicrophonePermissionsAsync: () => Promise<PermissionResponse>;
};

export const ReceivableEvents = {
  IsMicrophoneOn: 'IsMicrophoneOn',
  IsScreenShareOn: 'IsScreenShareOn',
  IsAppScreenShareOn: 'IsAppScreenShareOn', // only for iOS
  SimulcastConfigUpdate: 'SimulcastConfigUpdate',
  PeersUpdate: 'PeersUpdate',
  AudioDeviceUpdate: 'AudioDeviceUpdate',
  BandwidthEstimation: 'BandwidthEstimation',
  ReconnectionRetriesLimitReached: 'ReconnectionRetriesLimitReached',
  ReconnectionStarted: 'ReconnectionStarted',
  Reconnected: 'Reconnected',
  Warning: 'Warning',
  PeerStatusChanged: 'PeerStatusChanged',
  ReconnectionStatusChanged: 'ReconnectionStatusChanged',
  CurrentCameraChanged: 'CurrentCameraChanged',
  TrackAspectRatioUpdated: 'TrackAspectRatioUpdated',
} as const;

export type ReceivableEventPayloads = {
  [ReceivableEvents.IsMicrophoneOn]: boolean;
  [ReceivableEvents.IsScreenShareOn]: boolean;
  [ReceivableEvents.IsAppScreenShareOn]: boolean;
  [ReceivableEvents.SimulcastConfigUpdate]: SimulcastConfig;
  [ReceivableEvents.PeersUpdate]: void;
  [ReceivableEvents.AudioDeviceUpdate]: OnAudioDeviceEvent;
  [ReceivableEvents.BandwidthEstimation]: number | null;
  [ReceivableEvents.ReconnectionRetriesLimitReached]: void;
  [ReceivableEvents.ReconnectionStarted]: void;
  [ReceivableEvents.Reconnected]: void;
  [ReceivableEvents.Warning]: string;
  [ReceivableEvents.PeerStatusChanged]: PeerStatus;
  [ReceivableEvents.ReconnectionStatusChanged]: ReconnectionStatus;
  [ReceivableEvents.CurrentCameraChanged]: CurrentCameraChangedType;
  [ReceivableEvents.TrackAspectRatioUpdated]: {
    trackId: string;
    aspectRatio: number | null;
  };
};

export default requireNativeModule('RNFishjamClient') as RNFishjamClient &
  NativeModule<
    Record<
      keyof typeof ReceivableEvents,
      (payload: ReceivableEventPayloads) => void
    >
  >;
