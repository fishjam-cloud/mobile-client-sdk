import { EventEmitter, requireNativeModule } from 'expo-modules-core';
import { NativeModule } from 'react-native';

import type { RTCStats } from './debug/stats/types';
import type { ForegroundServiceOptions, SimulcastConfig } from './types';
import type { CameraConfigInternal, Camera } from './hooks/useCamera';
import type { Peer } from './hooks/usePeers';
import type { ScreenShareOptionsInternal } from './hooks/useScreenShare';
import type { ConnectionConfig } from './common/client';
import { PeerStatus } from './hooks/usePeerStatus';

type Metadata = { [key: string]: any };

type RNFishjamClient = {
  isMicrophoneOn: boolean;
  isCameraOn: boolean;
  isScreenShareOn: boolean;
  cameras: ReadonlyArray<Camera>;
  peerStatus: PeerStatus;

  joinRoom: (
    url: string,
    peerToken: string,
    peerMetadata: Metadata,
    config: ConnectionConfig,
  ) => Promise<void>;
  leaveRoom: () => Promise<void>;
  startCamera: (config: CameraConfigInternal) => Promise<void>;
  toggleMicrophone: () => Promise<boolean>;
  toggleCamera: () => Promise<boolean>;
  flipCamera: () => Promise<void>;
  switchCamera: (cameraId: string) => Promise<void>;
  handleScreenSharePermission: () => Promise<'granted' | 'denied'>;
  toggleScreenShare: (
    screenShareOptions: Partial<ScreenShareOptionsInternal>,
  ) => Promise<void>;
  getPeers: <PeerMetadataType extends Metadata>() => Promise<
    Peer<PeerMetadataType>[]
  >;
  updatePeerMetadata: <MetadataType extends Metadata>(
    metadata: MetadataType,
  ) => Promise<void>;
  updateVideoTrackMetadata: <MetadataType extends Metadata>(
    metadata: MetadataType,
  ) => Promise<void>;
  updateAudioTrackMetadata: <MetadataType extends Metadata>(
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
  startForegroundService: (options: ForegroundServiceOptions) => Promise<void>;
  stopForegroundService: () => void;
  getForegroundServiceConfig: () => ForegroundServiceOptions | null;
};

const nativeModule = requireNativeModule('RNFishjamClient');
export const nativeModuleEventEmitter = new EventEmitter(nativeModule);

export default nativeModule as RNFishjamClient & NativeModule;
