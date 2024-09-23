import { useCallback, useState } from 'react';

import {
  BandwidthLimit,
  SimulcastConfig,
  TrackBandwidthLimit,
  TrackEncoding,
  TrackMetadata,
} from '../types';
import RNFishjamClientModule from '../RNFishjamClientModule';
import { Platform } from 'react-native';
import { ReceivableEvents, useFishjamEvent } from './useFishjamEvent';

export type ScreenShareQuality = 'VGA' | 'HD5' | 'HD15' | 'FHD15' | 'FHD30';

export type ScreenShareOptions = {
  /**
   * Resolution + fps of screen share track, one of: `VGA`, `HD5`, `HD15`, `FHD15`, `FHD30`.
   * Note that quality might be worse than specified due to device capabilities, internet
   * connection etc.
   * @default `HD15``
   */
  quality: ScreenShareQuality;
  /**
   *  bandwidth limit of a screen share track. By default there is no bandwidth limit.
   */
  maxBandwidth: TrackBandwidthLimit;
};
export type ScreenShareOptionsInternal = {
  screenShareMetadata: TrackMetadata & { displayName?: string };
  /**
   * SimulcastConfig of a screen share track. By default simulcast is disabled.
   */
  simulcastConfig: SimulcastConfig;
};

const defaultSimulcastConfig = () => ({
  enabled: false,
  activeEncodings: [],
});

let screenShareSimulcastConfig: SimulcastConfig = defaultSimulcastConfig();

/**
 * This hook can toggle screen sharing on/off and provides current screen share state.
 * @returns An object with functions to manage screen share.
 * @category Screenshare
 * @group Hooks
 */
export function useScreenShare() {
  const [isScreenShareOn, setIsScreenShareOn] = useState(
    RNFishjamClientModule.isScreenShareOn,
  );

  const [simulcastConfig, setSimulcastConfig] = useState<SimulcastConfig>(
    screenShareSimulcastConfig,
  );

  useFishjamEvent(ReceivableEvents.IsScreenShareOn, setIsScreenShareOn);

  const toggleScreenShare = useCallback(
    async (screenShareOptions: Partial<ScreenShareOptions> = {}) => {
      const options = {
        ...screenShareOptions,
        screenShareMetadata: {
          displayName: 'presenting',
          type: 'screensharing' as const,
          active: !isScreenShareOn,
        },
      };
      await RNFishjamClientModule.toggleScreenShare(options);
      screenShareSimulcastConfig = defaultSimulcastConfig(); //to do: sync with camera settings
      setSimulcastConfig(screenShareSimulcastConfig);
    },
    [isScreenShareOn],
  );

  const toggleScreenShareTrackEncoding = useCallback(
    async (encoding: TrackEncoding) => {
      screenShareSimulcastConfig =
        await RNFishjamClientModule.toggleScreenShareTrackEncoding(encoding);
      setSimulcastConfig(screenShareSimulcastConfig);
    },
    [],
  );

  const setScreenShareTrackEncodingBandwidth = useCallback(
    async (encoding: TrackEncoding, bandwidth: BandwidthLimit) => {
      await RNFishjamClientModule.setScreenShareTrackEncodingBandwidth(
        encoding,
        bandwidth,
      );
    },
    [],
  );

  const setScreenShareTrackBandwidth = useCallback(
    async (bandwidth: BandwidthLimit) => {
      await RNFishjamClientModule.setScreenShareTrackBandwidth(bandwidth);
    },
    [],
  );

  const handleScreenSharePermission = useCallback(async () => {
    if (Platform.OS == 'android') {
      return await RNFishjamClientModule.handleScreenSharePermission();
    }
    return 'denied';
  }, []);

  return {
    isScreenShareOn,
    simulcastConfig,

    /**
     * Toggles the screen share on/off
     */
    toggleScreenShare,
    handleScreenSharePermission,

    /**
     * @deprecated
     */
    setScreenShareTrackBandwidth,
    /**
     * Toggles simulcast encoding of a screen share track on/off
     * @param encoding encoding to toggle
     * @deprecated
     */
    toggleScreenShareTrackEncoding,
    /**
     * updates maximum bandwidth for the given simulcast encoding of the screen share track
     * @param encoding encoding to update
     * @param bandwidth BandwidthLimit to set
     * @deprecated
     */
    setScreenShareTrackEncodingBandwidth,
    /**
     * updates maximum bandwidth for the screen share track. This value directly translates
     * to quality of the stream and the amount of RTP packets being sent. In case simulcast
     * is enabled bandwidth is split between all of the variant streams proportionally to
     * their resolution
     * @param bandwidth BandwidthLimit to set
     * @deprecated
     */
  };
}