import { initializeWarningListener } from './utils/errorListener';

// #region types
export type {
  TrackBandwidthLimit,
  TrackEncoding,
  SimulcastBandwidthLimit,
  BandwidthLimit,
  SimulcastConfig,
  VideoLayout,
} from './types';
export type { ConnectionConfig } from './common/client';
// #endregion

// #region methods
export { updatePeerMetadata } from './common/metadata';
export { setTargetTrackEncoding } from './common/webRTC';
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
  AudioTrack,
  VideoTrack,
  UsePeersResult,
  PeerWithTracks,
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
} from './hooks/useCamera';

export type {
  ScreenShareOptions,
  ScreenShareQuality,
} from './hooks/useScreenShare';
export type { ReconnectionStatus } from './hooks/useReconnection';
export type { PeerStatus } from './hooks/usePeerStatus';
export type { ForegroundServiceConfig } from './hooks/useForegroundService';
export type { ConnectionStatus } from './hooks/useConnection';
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
// #endregion

export { FishjamRoom } from './components/FishjamRoom';

initializeWarningListener();
