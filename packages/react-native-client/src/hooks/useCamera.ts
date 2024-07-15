import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import {
  BandwidthLimit,
  Metadata,
  SimulcastConfig,
  TrackBandwidthLimit,
  TrackEncoding,
} from '../types';
import RNFishjamClientModule from '../RNFishjamClientModule';
import { ReceivableEvents, eventEmitter } from '../common/eventEmitter';

type IsCameraOnEvent = { IsCameraOn: boolean };
type SimulcastConfigUpdateEvent = SimulcastConfig;

export type CaptureDevice = {
  id: string;
  name: string;
  isFrontFacing: boolean;
  isBackFacing: boolean;
};

export enum VideoQuality {
  QVGA_169 = 'QVGA169',
  VGA_169 = 'VGA169',
  QHD_169 = 'QHD169',
  HD_169 = 'HD169',
  FHD_169 = 'FHD169',
  QVGA_43 = 'QVGA43',
  VGA_43 = 'VGA43',
  QHD_43 = 'QHD43',
  HD_43 = 'HD43',
  FHD_43 = 'FHD43',
}

export type CameraConfig<MetadataType extends Metadata> = {
  /**
   * resolution + aspect ratio of local video track, one of: `QVGA_169`, `VGA_169`, `QHD_169`, `HD_169`,
   * `FHD_169`, `QVGA_43`, `VGA_43`, `QHD_43`, `HD_43`, `FHD_43`. Note that quality might be worse than
   * specified due to device capabilities, internet connection etc.
   * @default `VGA_169`
   */
  quality: VideoQuality;
  /**
   * whether to flip the dimensions of the video, that is whether to film in vertical orientation.
   * @default `true`
   */
  flipVideo: boolean;
  /**
   * a map `string -> any` containing video track metadata to be sent to the server.
   */
  videoTrackMetadata: MetadataType;
  /**
   *  SimulcastConfig of a video track. By default simulcast is disabled.
   */
  simulcastConfig: SimulcastConfig;
  /**
   *  bandwidth limit of a video track. By default there is no bandwidth limit.
   */
  maxBandwidth: TrackBandwidthLimit;
  /**
   * whether the camera track is initially enabled, you can toggle it on/off later with toggleCamera method
   * @default `true`
   */
  cameraEnabled: boolean;
  /**
   * id of the camera to start capture with. Get available cameras with `getCaptureDevices()`.
   * You can switch the cameras later with `flipCamera`/`switchCamera` functions.
   * @default the first front camera
   */
  captureDeviceId: string;
};

const defaultSimulcastConfig = () => ({
  enabled: false,
  activeEncodings: [],
});

/**
 * This hook can toggle camera on/off and provides current camera state.
 */
export function useCamera() {
  const [isCameraOn, setIsCameraOn] = useState<boolean>(
    RNFishjamClientModule.isCameraOn,
  );

  const [simulcastConfig, setSimulcastConfig] = useState<SimulcastConfig>(
    defaultSimulcastConfig(),
  );

  useEffect(() => {
    const eventListener = eventEmitter.addListener<SimulcastConfigUpdateEvent>(
      ReceivableEvents.SimulcastConfigUpdate,
      (event) => setSimulcastConfig(event),
    );
    return () => eventListener.remove();
  }, []);

  useEffect(() => {
    const eventListener = eventEmitter.addListener<IsCameraOnEvent>(
      ReceivableEvents.IsCameraOn,
      (event) => setIsCameraOn(event.IsCameraOn),
    );
    setIsCameraOn(RNFishjamClientModule.isCameraOn);
    return () => eventListener.remove();
  }, []);

  /**
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

  /**
   * Function to toggle camera on/off
   */
  const toggleCamera = useCallback(async () => {
    const state = await RNFishjamClientModule.toggleCamera();
    setIsCameraOn(state);
  }, []);

  /**
   * Starts local camera capture.
   * @param config configuration of the camera capture
   * @returns A promise that resolves when camera is started.
   */
  const startCamera = useCallback<
    <CameraConfigMetadataType extends Metadata>(
      config?: Readonly<Partial<CameraConfig<CameraConfigMetadataType>>>,
    ) => Promise<void>
  >(async (config = {}) => {
    // expo-modules on Android don't support Either type, so we workaround it
    if (Platform.OS === 'android') {
      if (typeof config.maxBandwidth === 'object') {
        await RNFishjamClientModule.startCamera({
          ...config,
          maxBandwidth: undefined,
          maxBandwidthMap: config.maxBandwidth,
        });
      } else {
        await RNFishjamClientModule.startCamera({
          ...config,
          maxBandwidth: undefined,
          maxBandwidthInt: config.maxBandwidth,
        });
      }
    } else {
      await RNFishjamClientModule.startCamera(config);
    }
  }, []);

  /**
   * Function that toggles between front and back camera. By default the front camera is used.
   * @returns A promise that resolves when camera is toggled.
   */
  const flipCamera = useCallback(async () => {
    return RNFishjamClientModule.flipCamera();
  }, []);

  /**
   * Function that switches to the specified camera. By default the front camera is used.
   * @returns A promise that resolves when camera is switched.
   */
  const switchCamera = useCallback(async (captureDeviceId: string) => {
    return RNFishjamClientModule.switchCamera(captureDeviceId);
  }, []);

  /** Function that queries available cameras.
   * @returns A promise that resolves to the list of available cameras.
   */
  const getCaptureDevices = useCallback(async () => {
    return RNFishjamClientModule.getCaptureDevices() as Promise<
      CaptureDevice[]
    >;
  }, []);

  /**
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

  return {
    isCameraOn,
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
