import { initializeWarningListener } from './utils/errorListener';

export type {
  Peer,
  Track,
  TrackType,
  VadStatus,
  EncodingReason,
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

export { useRTCStatistics } from './stats/useRTCStatistics';

export type {
  ScreenShareOptions,
  ScreenShareQuality,
} from './hooks/useScreenShare';
export { useScreenShare } from './hooks/useScreenShare';

export type { ReconnectionStatus } from './hooks/useReconnection';
export { useReconnection } from './hooks/useReconnection';

export { updatePeerMetadata } from './common/metadata';

export type { LoggingSeverity } from './common/webRTC';
export {
  changeWebRTCLoggingSeverity,
  setTargetTrackEncoding,
} from './common/webRTC';

export type { ConnectionConfig } from './common/client';
export { joinRoom, leaveRoom } from './common/client';

export type { VideoPreviewViewProps } from './components/VideoPreviewView';
export { VideoPreviewView } from './components/VideoPreviewView';

export type { VideoRendererProps } from './components/VideoRendererView';
export { VideoRendererView } from './components/VideoRendererView';

export { AndroidForegroundServiceType } from './types';
export {
  startForegroundService,
  stopForegroundService,
} from './utils/foregroundService';

export type { PeerStatus } from './hooks/usePeerStatus';
export { usePeerStatus } from './hooks/usePeerStatus';

export type {
  TrackBandwidthLimit,
  TrackEncoding,
  SimulcastBandwidthLimit,
  BandwidthLimit,
  SimulcastConfig,
  VideoLayout,
} from './types';

initializeWarningListener();
