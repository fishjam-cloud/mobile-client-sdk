import { initializeWarningListener } from './utils/errorListener';

export type {
  Peer,
  Track,
  TrackType,
  VadStatus,
  EncodingReason,
  AudioTrack,
  VideoTrack,
} from './hooks/usePeers';

export { usePeers } from './hooks/usePeers';

export type {
  AudioOutputDevice,
  AudioOutputDeviceType,
  AudioSessionMode,
} from './hooks/useAudioSettings';
export { useAudioSettings } from './hooks/useAudioSettings';

export { useBandwidthEstimation } from './hooks/useBandwidthEstimation';

export type {
  CameraId,
  Camera,
  CameraConfig,
  VideoQuality,
  CameraFacingDirection,
} from './hooks/useCamera';
export { useCamera } from './hooks/useCamera';

export { useMicrophone } from './hooks/useMicrophone';

export type {
  ScreenShareOptions,
  ScreenShareQuality,
} from './hooks/useScreenShare';
export { useScreenShare } from './hooks/useScreenShare';

export { useAppScreenShare } from './hooks/useAppScreenShare';

export type { ReconnectionStatus } from './hooks/useReconnection';
export { useReconnection } from './hooks/useReconnection';

export { updatePeerMetadata } from './common/metadata';

export { setTargetTrackEncoding } from './common/webRTC';

export type { ConnectionConfig } from './common/client';
export { joinRoom, leaveRoom } from './common/client';

export type { VideoPreviewViewProps } from './components/VideoPreviewView';
export { VideoPreviewView } from './components/VideoPreviewView';

export type { VideoRendererProps } from './components/VideoRendererView';
export { VideoRendererView } from './components/VideoRendererView';

export type { PeerStatus } from './hooks/usePeerStatus';
export { usePeerStatus } from './hooks/usePeerStatus';

export type {
  ForegroundServiceNotificationConfig,
  ForegroundServicePermissionsConfig,
} from './hooks/useForegroundService';
export { useForegroundService } from './hooks/useForegroundService';

export type {
  TrackBandwidthLimit,
  TrackEncoding,
  SimulcastBandwidthLimit,
  BandwidthLimit,
  SimulcastConfig,
  VideoLayout,
} from './types';

initializeWarningListener();
