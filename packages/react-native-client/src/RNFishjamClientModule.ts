import { requireNativeModule } from 'expo-modules-core';
import { NativeModule } from 'react-native';

import type { RTCStats } from './stats/types';
import type { Metadata, SimulcastConfig } from './types';
import type { CameraConfig, CaptureDevice } from './hooks/useCamera';
import type { MicrophoneConfig } from './hooks/useMicrophone';
import type { Endpoint } from './hooks/usePeers';
import type { ScreencastOptions } from './hooks/useScreencast';

type RNFishjamClient = {
  connect: (
    url: string,
    peerToken: string,
    peerMetadata: Metadata,
  ) => Promise<void>;
  leaveRoom: () => Promise<void>;
  startCamera: <MetadataType extends Metadata>(
    config: Partial<CameraConfig<MetadataType>>,
  ) => Promise<void>;
  startMicrophone: <MetadataType extends Metadata>(
    config: Partial<MicrophoneConfig<MetadataType>>,
  ) => Promise<void>;
  isMicrophoneOn: boolean;
  toggleMicrophone: () => Promise<boolean>;
  isCameraOn: boolean;
  toggleCamera: () => Promise<boolean>;
  flipCamera: () => Promise<void>;
  switchCamera: (captureDeviceId: string) => Promise<void>;
  getCaptureDevices: () => Promise<CaptureDevice[]>;
  toggleScreencast: <MetadataType extends Metadata>(
    screencastOptions: Partial<ScreencastOptions<MetadataType>>,
  ) => Promise<void>;
  isScreencastOn: boolean;
  getEndpoints: <
    EndpointMetadataType extends Metadata,
    VideoTrackMetadataType extends Metadata,
    AudioTrackMetadataType extends Metadata,
  >() => Promise<
    Endpoint<
      EndpointMetadataType,
      VideoTrackMetadataType,
      AudioTrackMetadataType
    >[]
  >;
  updateEndpointMetadata: <MetadataType extends Metadata>(
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