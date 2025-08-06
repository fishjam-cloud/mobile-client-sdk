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
export type { ConnectionConfig } from './common/client';
// #endregion

// #region methods
export { updatePeerMetadata } from './common/metadata';
export {
  /** @deprecated */
  joinRoom,
  /** @deprecated */
  leaveRoom,
} from './common/client';
// #endregion

// #region components
export type { VideoPreviewViewProps } from './components/VideoPreviewView';
export type { VideoRendererProps } from './components/VideoRendererView';
export type {
  LivestreamViewerProps,
  LivestreamViewerRef,
} from './components/LivestreamViewer';

export { VideoPreviewView } from './components/VideoPreviewView';
export { VideoRendererView } from './components/VideoRendererView';
export { LivestreamViewer } from './components/LivestreamViewer';
export { LivestreamStreamer } from './components/LivestreamStreamer';
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
} from './hooks/useConnection';
export type { AppScreenShareData } from './hooks/useAppScreenShare';
export type { useLivestreamViewerResult } from './hooks/useLivestreamViewer';
export type { useLivestreamStreamerResult } from './hooks/useLivestreamStreamer';
export type { UseSandboxProps } from './hooks/useSandbox';
export type { LivestreamStreamerProps } from './components/LivestreamStreamer';
export type { ConnectViewerConfig } from './hooks/useLivestreamViewer';
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
export { useLivestreamViewer } from './hooks/useLivestreamViewer';
export { useLivestreamStreamer } from './hooks/useLivestreamStreamer';
export { useSandbox } from './hooks/useSandbox';
export { cameras, VideoParameters } from 'react-native-whip-whep';
// #endregion

export {
  useCameraPermissions,
  useMicrophonePermissions,
} from './hooks/usePermissions';

export type { FishjamRoomProps } from './components/FishjamRoom';
export { FishjamRoom } from './components/FishjamRoom';

initializeWarningListener();
