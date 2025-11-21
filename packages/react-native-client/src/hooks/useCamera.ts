import { useCallback, useMemo } from 'react';
import { Brand, SimulcastConfig } from '../types';
import RNFishjamClientModule, {
  ReceivableEvents,
} from '../RNFishjamClientModule';
import { useFishjamEventState } from './internal/useFishjamEventState';

export type CameraId = Brand<string, 'CameraId'>;

export type CameraFacingDirection = 'front' | 'back' | 'unspecified';

export type Camera = {
  id: CameraId;
  name: string;
  facingDirection: CameraFacingDirection;
};

export type CurrentCameraChangedType = {
  currentCamera: Camera | null;
  isCameraOn: boolean;
  isCameraInitialized: boolean;
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

export type CameraConfigBase = {
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
   * @see [iOS](https://developer.apple.com/documentation/avfoundation/avcapturedevice/format)
   * @see [Android](https://github.com/webrtc-sdk/webrtc/blob/cdc3bba5aa38910a55428b919ba45aceac1ad9ad/sdk/android/api/org/webrtc/CameraEnumerationAndroid.java#L50)
   *
   * WebRTC device orientation handling:
   * @see [iOS](https://github.com/webrtc-sdk/webrtc/blob/cdc3bba5aa38910a55428b919ba45aceac1ad9ad/sdk/objc/components/capturer/RTCCameraVideoCapturer.m#L285)
   * @see [Android](https://github.com/pristineio/webrtc-mirror/blob/7a5bcdffaab90a05bc1146b2b1ea71c004e54d71/webrtc/sdk/android/src/java/org/webrtc/Camera2Session.java#L347)
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
   * @default `the first front camera`
   */
  cameraId?: CameraId;
};

export type CameraConfig = CameraConfigBase & {
  /**
   * @deprecated Simulcast is no longer supported
   */
  simulcastEnabled?: boolean;
};

export type CameraConfigInternal = CameraConfigBase & {
  videoTrackMetadata?: { active: boolean; type: 'camera' };
  /**
   * @deprecated Simulcast is no longer supported
   */
  simulcastConfig?: SimulcastConfig;
};

const defaultSimulcastConfig = () =>
  ({
    enabled: false,
  }) satisfies SimulcastConfig;

function getSimulcastConfig(
  simulcastEnabled: boolean | undefined,
): SimulcastConfig | undefined {
  // TODO FCE-2265: Remove in next major release
  return undefined;
}

export function updateCameraConfig(
  config: Readonly<CameraConfig>,
): CameraConfigInternal {
  return {
    ...config,
    videoTrackMetadata: { active: true, type: 'camera' },
    simulcastConfig: getSimulcastConfig(config.simulcastEnabled),
  };
}

/**
 * This hook can toggle camera on/off and provides current camera state.
 * @category Devices
 * @group Hooks
 */
export function useCamera() {
  const simulcastConfig = useFishjamEventState(
    ReceivableEvents.SimulcastConfigUpdate,
    defaultSimulcastConfig(), // TODO: Fetch from native
  );

  const {
    currentCamera: currentCameraState,
    isCameraOn,
    isCameraInitialized,
  } = useFishjamEventState(ReceivableEvents.CurrentCameraChanged, {
    currentCamera: RNFishjamClientModule.currentCamera,
    isCameraOn: RNFishjamClientModule.isCameraOn,
    isCameraInitialized: RNFishjamClientModule.isCameraInitialized,
  });

  // For Android Expo converts null to undefined ¯\_(ツ)_/¯
  const currentCamera = currentCameraState ?? null;

  const cameras = useMemo(() => RNFishjamClientModule.cameras, []);

  const prepareCamera = useCallback(
    async (config: Readonly<CameraConfig> = {}) => {
      const camera = RNFishjamClientModule.cameras.find((cam) =>
        config.cameraId
          ? cam.id === config.cameraId
          : cam.facingDirection === 'front',
      );

      const updatedConfig = updateCameraConfig({
        ...config,
        cameraId: camera?.id,
      });
      return RNFishjamClientModule.startCamera(updatedConfig);
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
    /**
     * A value indicating if camera was already initialized (if `prepareCamera` was called).
     */
    isInitialized: isCameraInitialized,
    /**
     * Enable/disable current camera
     */
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
     */
    switchCamera,
  };
}
