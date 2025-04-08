import { z } from 'zod';
import {
  ReceivableEventPayloads,
  ReceivableEvents,
} from '../RNFishjamClientModule';

const SimulcastConfigSchema = z.object({
  enabled: z.boolean(),
  activeEncodings: z.array(z.enum(['l', 'm', 'h'])),
});

const AudioOutputDeviceSchema = z.object({
  name: z.string(),
  type: z.enum(['bluetooth', 'headset', 'speaker', 'earpiece']),
});

const AudioDeviceEventSchema = z.object({
  availableDevices: z.array(AudioOutputDeviceSchema),
  selectedDevice: AudioOutputDeviceSchema.nullable(),
});

const CameraSchema = z.object({
  id: z.string(),
  name: z.string(),
  facingDirection: z.enum(['front', 'back', 'unspecified']),
});

const CameraChangedEventSchema = z.object({
  isCameraOn: z.boolean(),
  currentCamera: CameraSchema.nullable(),
});

const TrackAspectRatioUpdatedEventSchema = z.object({
  trackId: z.string(),
  aspectRatio: z.number(),
});

export function validateNativeEventPayload<
  T extends keyof typeof ReceivableEvents,
>(eventName: T, payload: ReceivableEventPayloads[T]): void {
  switch (eventName) {
    case ReceivableEvents.IsMicrophoneOn:
    case ReceivableEvents.IsScreenShareOn:
    case ReceivableEvents.IsAppScreenShareOn:
      z.boolean().parse(payload);
      break;

    case ReceivableEvents.SimulcastConfigUpdate:
      SimulcastConfigSchema.parse(payload);
      break;

    case ReceivableEvents.PeersUpdate:
      break;

    case ReceivableEvents.AudioDeviceUpdate:
      AudioDeviceEventSchema.parse(payload);
      break;

    case ReceivableEvents.BandwidthEstimation:
      z.number().nullable().parse(payload);
      break;

    case ReceivableEvents.ReconnectionRetriesLimitReached:
    case ReceivableEvents.ReconnectionStarted:
    case ReceivableEvents.Reconnected:
      z.undefined().parse(payload);
      break;

    case ReceivableEvents.Warning:
      z.string().parse(payload);
      break;

    case ReceivableEvents.PeerStatusChanged:
      z.enum(['connecting', 'connected', 'error', 'idle']).parse(payload);
      break;

    case ReceivableEvents.ReconnectionStatusChanged:
      z.enum(['connecting', 'connected', 'error', 'reconnecting']).parse(
        payload,
      );
      break;

    case ReceivableEvents.CurrentCameraChanged:
      CameraChangedEventSchema.parse(payload);
      break;

    case ReceivableEvents.TrackAspectRatioUpdated:
      TrackAspectRatioUpdatedEventSchema.parse(payload);
      break;

    default:
      throw new Error(`Unknown event: ${eventName}`);
  }
}
