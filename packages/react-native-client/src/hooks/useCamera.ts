import { useCallback, useMemo } from 'react';
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
import { ReceivableEvents } from './useFishjamEvent';
import { useFishjamEventState } from './useFishjamEventState';

export type CameraId = Brand<string, 'CameraId'>;

export type CameraFacingDirection = 'front' | 'back' | 'unspecified';

export type Camera = {
  id: CameraId;
  name: string;
  facingDirection: CameraFacingDirection;
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
   * This basically switches width with height and is only used to select closes capture format.
   *
   * To record horizontal video your phone orientation must be in landscape and your app must support this orientation.
   *
   * Platform specific capture formats:
   * @see iOS: https://developer.apple.com/documentation/avfoundation/avcapturedevice/format
   * @see Android: https://github.com/webrtc-sdk/webrtc/blob/cdc3bba5aa38910a55428b919ba45aceac1ad9ad/sdk/android/api/org/webrtc/CameraEnumerationAndroid.java#L50
   *
   * WebRTC device orientation handling:
   * @see iOS:  https://github.com/webrtc-sdk/webrtc/blob/cdc3bba5aa38910a55428b919ba45aceac1ad9ad/sdk/objc/components/capturer/RTCCameraVideoCapturer.m#L285
   * @see Android: https://github.com/pristineio/webrtc-mirror/blob/7a5bcdffaab90a05bc1146b2b1ea71c004e54d71/webrtc/sdk/android/src/java/org/webrtc/Camera2Session.java#L347
   *
   * @default `true`
   */
  flipDimensions?: boolean;
  /**
   * whether the camera track is initially enabled, you can toggle it on/off later with toggleCamera method
   * @default `true`
   */
  cameraEnabled?: boolean;
  /**
   * id of the camera to start capture with. Get available cameras with `cameras`.
   * You can switch the cameras later with `switchCamera` functions.
   * @default the first front camera
   */
  cameraId?: CameraId;
};

export type CameraConfig = CameraConfigBase & {
  /**
   *  whether video track uses simulcast. By default simulcast is disabled.
   */
  simulcastEnabled?: boolean;
  /**
   *  bandwidth limit of a video track. By default there is no bandwidth limit.
   */
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
  // 3 simulcast layers + 1 screen share layer = 4, which is too much
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
    ...maxBandwidthConfig({ l: 150, m: 500, h: 1500 }),
    videoTrackMetadata: { active: true, type: 'camera' },
    simulcastConfig: simulcastConfig(config.simulcastEnabled),
  };
}

/**
 * This hook can toggle camera on/off and provides current camera state.
 * @category Devices
 * @group Hooks
 */
export function useCamera() {
  const simulcastConfig = useFishjamEventState<SimulcastConfig>(
    ReceivableEvents.SimulcastConfigUpdate,
    defaultSimulcastConfig(), // TODO: Fetch from native
  );

  const isCameraOn = useFishjamEventState<boolean>(
    ReceivableEvents.IsCameraOn,
    RNFishjamClientModule.isCameraOn,
  );

  const currentCamera = useFishjamEventState<Camera | null>(
    ReceivableEvents.CurrentCameraChanged,
    RNFishjamClientModule.currentCamera,
  );

  const cameras = useMemo(() => RNFishjamClientModule.cameras, []);

  const prepareCamera = useCallback(
    async (config: Readonly<CameraConfig> = {}) => {
      const camera = RNFishjamClientModule.cameras.find((camera) =>
        config.cameraId
          ? camera.id === config.cameraId
          : camera.facingDirection === 'front',
      );

      const updatedConfig = updateCameraConfig({
        ...config,
        cameraId: camera?.id,
      });
      await RNFishjamClientModule.startCamera(updatedConfig);
    },
    [],
  );

  const toggleCamera = useCallback(async () => {
    const state = await RNFishjamClientModule.toggleCamera();
    await RNFishjamClientModule.updateVideoTrackMetadata({
      active: state,
      type: 'camera',
    });
  }, []);

  const switchCamera = useCallback(async (cameraId: CameraId) => {
    await RNFishjamClientModule.switchCamera(cameraId);
  }, []);

  const setVideoTrackBandwidth = useCallback(
    async (bandwidth: BandwidthLimit) => {
      await RNFishjamClientModule.setVideoTrackBandwidth(bandwidth);
    },
    [],
  );

  const toggleVideoTrackEncoding = useCallback(
    async (encoding: TrackEncoding) => {
      await RNFishjamClientModule.toggleVideoTrackEncoding(encoding);
    },
    [],
  );

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
    /**
     * Informs if user camera is streaming video
     */
    isCameraOn,
    /**
     * Which camera is now used for streaming (or will be used as default when camera will be enabled)
     */
    currentCamera,
    /**
     * Simulcast configuration
     */
    simulcastConfig,
    /**
     * Property that lists cameras available on device.
     * @returns A promise that resolves to the list of available cameras.
     */
    cameras,

    /** Enable/disable current camera */
    toggleCamera,
    /**
     * Prepares camera and starts local video track
     * @param config configuration of the camera capture
     * @returns A promise that resolves when camera is started.
     */
    prepareCamera,
    /**
     * Switches to the specified camera.
     * List of available devices can be retrieved from `cameras` variable
     * @returns A promise that resolves when camera is switched.
     */ switchCamera,

    /**
     * @deprecated
     * toggles encoding of a video track on/off
     * @param encoding encoding to toggle
     */
    toggleVideoTrackEncoding,
    /**
     * updates maximum bandwidth for the given simulcast encoding of the video track
     * @param encoding  encoding to update
     * @param bandwidth BandwidthLimit to set
     * @deprecated
     */
    setVideoTrackEncodingBandwidth,
    /**
     * updates maximum bandwidth for the video track. This value directly translates
     * to quality of the stream and the amount of RTP packets being sent. In case simulcast
     * is enabled bandwidth is split between all of the variant streams proportionally to
     * their resolution.
     * @param BandwidthLimit to set
     * @deprecated
     */
    setVideoTrackBandwidth,
  };
}
