import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

import {
  BandwidthLimit,
  Brand,
  SimulcastBandwidthLimit,
  SimulcastConfig,
  TrackBandwidthLimit,
  TrackEncoding,
} from '../types';
import RNFishjamClientModule from '../RNFishjamClientModule';
import { ReceivableEvents, useFishjamEvent } from './useFishjamEvent';

type IsCameraOnEvent = { IsCameraOn: boolean };
type SimulcastConfigUpdateEvent = SimulcastConfig;
export type CaptureDeviceId = Brand<string, 'CaptureDeviceId'>;

export type CaptureDevice = {
  id: CaptureDeviceId;
  name: string;
  isFrontFacing: boolean;
  isBackFacing: boolean;
};

export type VideoQuality =
  | 'QVGA169'
  | 'VGA169'
  | 'QHD169'
  | 'HD169'
  | 'FHD169'
  | 'QVGA43'
  | 'VGA43'
  | 'QHD43'
  | 'HD43'
  | 'FHD43';

type CameraConfigBase = {
  /**
   * resolution + aspect ratio of local video track, one of: `QVGA_169`, `VGA_169`, `QHD_169`, `HD_169`,
   * `FHD_169`, `QVGA_43`, `VGA_43`, `QHD_43`, `HD_43`, `FHD_43`. Note that quality might be worse than
   * specified due to device capabilities, internet connection etc.
   * @default `VGA_169`
   */
  quality?: VideoQuality;
  /**
   * whether to flip the dimensions of the video, that is whether to film in vertical orientation.
   * @default `true`
   */
  flipVideo?: boolean;
  /**
   * whether the camera track is initially enabled, you can toggle it on/off later with toggleCamera method
   * @default `true`
   */
  cameraEnabled?: boolean;
  /**
   * id of the camera to start capture with. Get available cameras with `getCaptureDevices()`.
   * You can switch the cameras later with `flipCamera`/`switchCamera` functions.
   * @default the first front camera
   */
  captureDeviceId?: CaptureDeviceId;
};

export type CameraConfig = CameraConfigBase & {
  /**
   *  whether video track uses simulcast. By default simulcast is disabled.
   */
  simulcastEnabled?: boolean;
  /**
   *  bandwidth limit of a video track. By default there is no bandwidth limit.
   */
  maxBandwidth?: TrackBandwidthLimit;
};

export type CameraConfigInternal = CameraConfigBase & {
  videoTrackMetadata?: { active: boolean; type: 'camera' };
  /**
   *  SimulcastConfig of a video track. By default simulcast is disabled.
   */
  simulcastConfig?: SimulcastConfig;
  /**
   *  bandwidth limit of a video track. By default there is no bandwidth limit.
   */
  maxBandwidth?: TrackBandwidthLimit;
} & (
    | { maxBandwidthInt?: BandwidthLimit }
    | { maxBandwidthMap?: SimulcastBandwidthLimit }
  );

const defaultSimulcastConfig = () => ({
  enabled: false,
  activeEncodings: [],
});

function maxBandwidthConfig(maxBandwidth: TrackBandwidthLimit | undefined) {
  if (Platform.OS === 'android') {
    if (typeof maxBandwidth === 'object') {
      return {
        maxBandwidth: undefined,
        maxBandwidthMap: maxBandwidth,
      };
    } else {
      return {
        maxBandwidth: undefined,
        maxBandwidthInt: maxBandwidth,
      };
    }
  }
  return { maxBandwidth };
}

function simulcastConfig(
  simulcastEnabled: boolean | undefined,
): SimulcastConfig | undefined {
  // iOS has a limit of 3 hardware encoders
  // 3 simulcast layers + 1 screencast layer = 4, which is too much
  // so we limit simulcast layers to 2
  if (simulcastEnabled) {
    return Platform.select<SimulcastConfig>({
      ios: { enabled: true, activeEncodings: ['l', 'h'] },
      android: { enabled: true, activeEncodings: ['l', 'm', 'h'] },
    });
  }
  return undefined;
}

export function updateCameraConfig(
  config: Readonly<CameraConfig>,
): CameraConfigInternal {
  return {
    ...config,
    ...maxBandwidthConfig(config.maxBandwidth),
    videoTrackMetadata: { active: true, type: 'camera' },
    simulcastConfig: simulcastConfig(config.simulcastEnabled),
  };
}

/**
 * This hook can toggle camera on/off and provides current camera state.
 */
export function useCamera() {
  const [isCameraOn, setIsCameraOn] = useState<IsCameraOnEvent>({
    IsCameraOn: RNFishjamClientModule.isCameraOn,
  });

  const [simulcastConfig, setSimulcastConfig] = useState<SimulcastConfig>(
    defaultSimulcastConfig(),
  );

  useFishjamEvent<SimulcastConfigUpdateEvent>(
    ReceivableEvents.SimulcastConfigUpdate,
    setSimulcastConfig,
  );

  useFishjamEvent<IsCameraOnEvent>(ReceivableEvents.IsCameraOn, setIsCameraOn);

  /**
   * Function to toggle camera on/off
   */
  const toggleCamera = useCallback(async () => {
    const state = await RNFishjamClientModule.toggleCamera();
    await RNFishjamClientModule.updateVideoTrackMetadata({
      active: state,
      type: 'camera',
    });
    setIsCameraOn({ IsCameraOn: state });
  }, []);

  /**
   * Starts local camera capture.
   * @param config configuration of the camera capture
   * @returns A promise that resolves when camera is started.
   */

  const startCamera = useCallback(
    async (config: Readonly<CameraConfig> = {}) => {
      const updatedConfig = updateCameraConfig(config);
      await RNFishjamClientModule.startCamera(updatedConfig);
    },
    [],
  );

  /**
   * Function that toggles between front and back camera. By default the front camera is used.
   * @returns A promise that resolves when camera is toggled.
   */
  const flipCamera = useCallback(async () => {
    await RNFishjamClientModule.flipCamera();
  }, []);

  /**
   * Function that switches to the specified camera. By default the front camera is used.
   * @returns A promise that resolves when camera is switched.
   */
  const switchCamera = useCallback(async (captureDeviceId: CaptureDeviceId) => {
    await RNFishjamClientModule.switchCamera(captureDeviceId);
  }, []);

  /** Function that queries available cameras.
   * @returns A promise that resolves to the list of available cameras.
   */
  const getCaptureDevices = useCallback(async () => {
    return RNFishjamClientModule.getCaptureDevices();
  }, []);

  /**
   * @deprecated
   * updates maximum bandwidth for the video track. This value directly translates
   * to quality of the stream and the amount of RTP packets being sent. In case simulcast
   * is enabled bandwidth is split between all of the variant streams proportionally to
   * their resolution.
   * @param BandwidthLimit to set
   */
  const setVideoTrackBandwidth = useCallback(
    async (bandwidth: BandwidthLimit) => {
      await RNFishjamClientModule.setVideoTrackBandwidth(bandwidth);
    },
    [],
  );

  /**
   * @deprecated
   * toggles encoding of a video track on/off
   * @param encoding encoding to toggle
   */
  const toggleVideoTrackEncoding = useCallback(
    async (encoding: TrackEncoding) => {
      const videoSimulcastConfig =
        await RNFishjamClientModule.toggleVideoTrackEncoding(encoding);
      setSimulcastConfig(videoSimulcastConfig);
    },
    [],
  );

  /**
   * @deprecated
   * updates maximum bandwidth for the given simulcast encoding of the video track
   * @param encoding  encoding to update
   * @param bandwidth BandwidthLimit to set
   */
  const setVideoTrackEncodingBandwidth = useCallback(
    async (encoding: TrackEncoding, bandwidth: BandwidthLimit) => {
      await RNFishjamClientModule.setVideoTrackEncodingBandwidth(
        encoding,
        bandwidth,
      );
    },
    [],
  );

  return {
    isCameraOn: isCameraOn.IsCameraOn,
    simulcastConfig,
    toggleCamera,
    startCamera,
    flipCamera,
    switchCamera,
    getCaptureDevices,
    toggleVideoTrackEncoding,
    setVideoTrackEncodingBandwidth,
    setVideoTrackBandwidth,
  };
}
