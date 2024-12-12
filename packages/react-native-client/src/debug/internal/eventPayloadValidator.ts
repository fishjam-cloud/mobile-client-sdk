import {
  ReceivableEventPayloads,
  ReceivableEvents,
} from '../../RNFishjamClientModule';
import type { PeerStatus } from '../../hooks/usePeerStatus';
import type { ReconnectionStatus } from '../../hooks/useReconnection';
import type {
  GenericMetadata,
  SimulcastConfig,
  TrackMetadata,
} from '../../types';
import type {
  AudioOutputDevice,
  AudioOutputDeviceType,
  OnAudioDeviceEvent,
} from '../../hooks/useAudioSettings';
import type {
  Camera,
  CameraFacingDirection,
  CurrentCameraChangedType,
} from '../../hooks/useCamera';
import { AudioTrack, Peer, VideoTrack } from '../../hooks/usePeers';

export function isNativeEventPayloadValid<
  T extends keyof typeof ReceivableEvents,
>(eventName: T, payload: ReceivableEventPayloads[T]): boolean {
  switch (eventName) {
    case ReceivableEvents.IsMicrophoneOn:
    case ReceivableEvents.IsScreenShareOn:
    case ReceivableEvents.IsAppScreenShareOn:
      return typeof payload === 'boolean';

    case ReceivableEvents.SimulcastConfigUpdate:
      return isSimulcastConfig(payload);

    case ReceivableEvents.PeersUpdate:
      return Array.isArray(payload) && payload.every(isPeer);

    case ReceivableEvents.AudioDeviceUpdate:
      return isAudioDeviceEvent(payload);

    case ReceivableEvents.BandwidthEstimation:
      return typeof payload === 'number' || payload === null;

    case ReceivableEvents.ReconnectionRetriesLimitReached:
    case ReceivableEvents.ReconnectionStarted:
    case ReceivableEvents.Reconnected:
      return payload === undefined;

    case ReceivableEvents.Warning:
      return typeof payload === 'string';

    case ReceivableEvents.PeerStatusChanged:
      return isPeerStatus(payload);

    case ReceivableEvents.ReconnectionStatusChanged:
      return isReconnectionStatus(payload);

    case ReceivableEvents.CurrentCameraChanged:
      return isCameraChangedEvent(payload);

    default:
      return false;
  }
}

function isPeerStatus(value: unknown): value is PeerStatus {
  return (
    typeof value === 'string' &&
    ['connecting', 'connected', 'error', 'idle'].includes(value)
  );
}

function isReconnectionStatus(value: unknown): value is ReconnectionStatus {
  return (
    typeof value === 'string' &&
    ['connecting', 'connected', 'error'].includes(value)
  );
}

function isSimulcastConfig(value: unknown): value is SimulcastConfig {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const config = value as SimulcastConfig;
  const validEncodings = ['l', 'm', 'h'];
  return (
    typeof config.enabled === 'boolean' &&
    Array.isArray(config.activeEncodings) &&
    config.activeEncodings.every(
      (e) => typeof e === 'string' && validEncodings.includes(e),
    )
  );
}

function isTrack(value: unknown): value is AudioTrack | VideoTrack {
  if (!value || typeof value !== 'object') return false;
  const track = value as Record<string, unknown>;

  const baseValid =
    typeof track.id === 'string' &&
    typeof track.isActive === 'boolean' &&
    (track.metadata === undefined || isTrackMetadata(track.metadata));

  if (!baseValid) return false;

  if (track.type === 'Audio') {
    return (
      track.vadStatus === undefined ||
      ['silence', 'speech'].includes(track.vadStatus as string)
    );
  }

  if (track.type === 'Video') {
    const videoTrack = track as Record<string, unknown>;
    return (
      (videoTrack.encoding === null ||
        typeof videoTrack.encoding === 'string') &&
      (videoTrack.encodingReason === null ||
        typeof videoTrack.encodingReason === 'string')
    );
  }

  return false;
}

function isTrackMetadata(value: unknown): value is TrackMetadata {
  if (!value || typeof value !== 'object') return false;
  const metadata = value as Record<string, unknown>;

  return (
    typeof metadata.active === 'boolean' &&
    typeof metadata.type === 'string' &&
    ['microphone', 'camera', 'screenShareVideo', 'screenShareAudio'].includes(
      metadata.type,
    )
  );
}

function isMetadata(value: unknown): value is GenericMetadata {
  return value !== null && typeof value === 'object';
}

function isPeer(
  value: unknown,
): value is Peer<GenericMetadata, GenericMetadata> {
  if (!value || typeof value !== 'object') return false;
  const peer = value as Record<string, unknown>;

  return (
    typeof peer.id === 'string' &&
    typeof peer.isLocal === 'boolean' &&
    Array.isArray(peer.tracks) &&
    peer.tracks.every(isTrack) &&
    isMetadata(peer.metadata)
  );
}

function isAudioOutputDevice(value: unknown): value is AudioOutputDevice {
  if (!value || typeof value !== 'object') return false;
  const device = value as Record<string, unknown>;

  return (
    typeof device.name === 'string' &&
    typeof device.type === 'string' &&
    isAudioOutputDeviceType(device.type)
  );
}

function isAudioOutputDeviceType(
  value: unknown,
): value is AudioOutputDeviceType {
  return (
    typeof value === 'string' &&
    ['bluetooth', 'headset', 'speaker', 'earpiece'].includes(value)
  );
}

function isAudioDeviceEvent(value: unknown): value is OnAudioDeviceEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as Record<string, unknown>;

  if (!Array.isArray(event.availableDevices)) {
    return false;
  }

  return (
    event.availableDevices.every(isAudioOutputDevice) &&
    (event.selectedDevice === null || isAudioOutputDevice(event.selectedDevice))
  );
}

function isCameraFacingDirection(
  value: unknown,
): value is CameraFacingDirection {
  return (
    typeof value === 'string' &&
    ['front', 'back', 'unspecified'].includes(value)
  );
}

function isCamera(value: unknown): value is Camera {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const camera = value as Record<string, unknown>;

  return (
    typeof camera.id === 'string' &&
    typeof camera.name === 'string' &&
    isCameraFacingDirection(camera.facingDirection)
  );
}

function isCameraChangedEvent(
  value: unknown,
): value is CurrentCameraChangedType {
  if (!value || typeof value !== 'object') return false;
  const event = value as Record<string, unknown>;

  return (
    typeof event.isCameraOn === 'boolean' &&
    (event.currentCamera === null || isCamera(event.currentCamera))
  );
}
