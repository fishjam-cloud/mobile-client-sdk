import { requireNativeModule } from 'expo-modules-core';
import { NativeModule } from 'react-native';

import type { RTCStats } from './stats/types';
import type { Metadata, SimulcastConfig } from './types';
import type { CameraConfigInternal, CaptureDevice } from './hooks/useCamera';
import type { Participiant } from './hooks/useParticipiants';
import type { ScreencastOptionsInternal } from './hooks/useScreencast';
import type { ConnectionConfig } from './common/client';

type RNFishjamClient = {
  connect: (
    url: string,
    peerToken: string,
    peerMetadata: Metadata,
    config: ConnectionConfig,
  ) => Promise<void>;
  leaveRoom: () => Promise<void>;
  startCamera: (config: CameraConfigInternal) => Promise<void>;
  isMicrophoneOn: boolean;
  toggleMicrophone: () => Promise<boolean>;
  isCameraOn: boolean;
  toggleCamera: () => Promise<boolean>;
  flipCamera: () => Promise<void>;
  switchCamera: (captureDeviceId: string) => Promise<void>;
  getCaptureDevices: () => Promise<CaptureDevice[]>;
  handleScreencastPermission: () => Promise<'granted' | 'denied'>;
  toggleScreencast: (
    screencastOptions: Partial<ScreencastOptionsInternal>,
  ) => Promise<void>;
  isScreencastOn: boolean;
  getPeers: <PeerMetadataType extends Metadata>() => Promise<
    Participiant<PeerMetadataType>[]
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
  updateScreencastTrackMetadata: <MetadataType extends Metadata>(
    metadata: MetadataType,
  ) => Promise<void>;
  setOutputAudioDevice: (audioDevice: string) => Promise<void>;
  startAudioSwitcher: () => Promise<void>;
  stopAudioSwitcher: () => Promise<void>;
  selectAudioSessionMode: (sessionMode: string) => Promise<void>;
  showAudioRoutePicker: () => Promise<void>;
  toggleScreencastTrackEncoding: (encoding: string) => Promise<SimulcastConfig>;
  setScreencastTrackBandwidth: (bandwidth: number) => Promise<void>;
  setScreencastTrackEncodingBandwidth: (
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
};

const nativeModule = requireNativeModule('RNFishjamClient');

export default nativeModule as RNFishjamClient & NativeModule;
