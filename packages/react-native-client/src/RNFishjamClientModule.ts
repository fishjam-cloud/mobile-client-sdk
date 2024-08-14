import { requireNativeModule } from 'expo-modules-core';
import { NativeModule } from 'react-native';

import type { RTCStats } from './stats/types';
import type {
  BandwidthLimit,
  Metadata,
  SimulcastBandwidthLimit,
  SimulcastConfig,
} from './types';
import type { CameraConfig, CaptureDevice } from './hooks/useCamera';
import type { Peer } from './hooks/usePeers';
import type { ScreencastOptions } from './hooks/useScreencast';

type InternalCameraConfig<MetadataType extends Metadata> = Partial<
  CameraConfig<MetadataType> &
    (
      | { maxBandwidthInt: BandwidthLimit }
      | { maxBandwidthMap: SimulcastBandwidthLimit }
    )
>;

type RNFishjamClient = {
  connect: (
    url: string,
    peerToken: string,
    peerMetadata: Metadata,
  ) => Promise<void>;
  leaveRoom: () => Promise<void>;
  startCamera: <MetadataType extends Metadata>(
    config: InternalCameraConfig<MetadataType>,
  ) => Promise<void>;
  isMicrophoneOn: boolean;
  toggleMicrophone: () => Promise<boolean>;
  isCameraOn: boolean;
  toggleCamera: () => Promise<boolean>;
  flipCamera: () => Promise<void>;
  switchCamera: (captureDeviceId: string) => Promise<void>;
  getCaptureDevices: () => Promise<CaptureDevice[]>;
  handleScreencastPermission: () => Promise<'granted' | 'denied'>;
  toggleScreencast: <MetadataType extends Metadata>(
    screencastOptions: Partial<ScreencastOptions<MetadataType>>,
  ) => Promise<void>;
  isScreencastOn: boolean;
  getPeers: <
    PeerMetadataType extends Metadata,
    VideoTrackMetadataType extends Metadata,
    AudioTrackMetadataType extends Metadata,
  >() => Promise<
    Peer<PeerMetadataType, VideoTrackMetadataType, AudioTrackMetadataType>[]
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
