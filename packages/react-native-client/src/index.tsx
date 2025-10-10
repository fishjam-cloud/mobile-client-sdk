import { initializeWarningListener } from './utils/errorListener';

// #region types
export type {
  SimulcastConfig,
  VideoLayout,
  GenericMetadata,
  TrackMetadata,
  Brand,
  RoomType,
} from './types';
// #endregion

// #region methods
export { updatePeerMetadata } from './common/metadata';

// #region components
export type { VideoPreviewViewProps } from './components/VideoPreviewView';
export type { VideoRendererProps } from './components/VideoRendererView';

export { VideoPreviewView } from './components/VideoPreviewView';
export { VideoRendererView } from './components/VideoRendererView';
// #endregion

// #region types for hooks
export type {
  Peer,
  PeerId,
  Track,
  TrackId,
  TrackType,
  VadStatus,
  EncodingReason,
  TrackBase,
  AudioTrack,
  VideoTrack,
  UsePeersResult,
  PeerWithTracks,
  PeerTrackMetadata,
  DistinguishedTracks,
} from './hooks/usePeers';

export type {
  AudioOutputDevice,
  AudioOutputDeviceType,
  AudioSessionMode,
} from './hooks/useAudioSettings';

export type {
  CameraId,
  Camera,
  CameraConfig,
  VideoQuality,
  CameraFacingDirection,
  CameraConfigBase,
} from './hooks/useCamera';

export type {
  ScreenShareOptions,
  ScreenShareQuality,
} from './hooks/useScreenShare';
export type { ForegroundServiceConfig } from './hooks/useForegroundService';
export type {
  JoinRoomConfig,
  ReconnectionStatus,
  PeerStatus,
  ConnectionConfig,
} from './hooks/useConnection';
export type { AppScreenShareData } from './hooks/useAppScreenShare';
export type { UseSandboxProps } from './hooks/useSandbox';
export type { CallKitConfig, UseCallKitResult } from './hooks/useCallKit';
// #endregion

// #region hooks
export { useAudioSettings } from './hooks/useAudioSettings';
export { useBandwidthEstimation } from './hooks/useBandwidthEstimation';
export { useCamera } from './hooks/useCamera';
export { useMicrophone } from './hooks/useMicrophone';
export { useScreenShare } from './hooks/useScreenShare';
export { useAppScreenShare } from './hooks/useAppScreenShare';
export { useReconnection } from './hooks/useReconnection';
export { usePeerStatus } from './hooks/usePeerStatus';
export { usePeers } from './hooks/usePeers';
export { useForegroundService } from './hooks/useForegroundService';
export { useConnection } from './hooks/useConnection';
export { useUpdatePeerMetadata } from './hooks/useUpdatePeerMetadata';
export { useSandbox } from './hooks/useSandbox';
export { useCallKit } from './hooks/useCallKit';
// #endregion

export {
  useCameraPermissions,
  useMicrophonePermissions,
} from './hooks/usePermissions';

export type { FishjamRoomProps } from './components/FishjamRoom';
export { FishjamRoom } from './components/FishjamRoom';

initializeWarningListener();

// Debug/config API
export { setOverwriteDebugConfig, DebugConfig } from './utils/config';
