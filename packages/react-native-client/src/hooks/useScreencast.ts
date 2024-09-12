import { useCallback, useState } from 'react';

import {
  BandwidthLimit,
  SimulcastConfig,
  TrackBandwidthLimit,
  TrackEncoding,
  TrackMetadata,
} from '../types';
import RNFishjamClientModule from '../RNFishjamClientModule';
import { ReceivableEvents } from '../common/eventEmitter';
import { Platform } from 'react-native';
import { useFishjamEvent } from './useFishjamEvent';

type IsScreencastOnEvent = { IsScreencastOn: boolean };

export type ScreencastQuality = 'VGA' | 'HD5' | 'HD15' | 'FHD15' | 'FHD30';

export type ScreencastOptions = {
  /**
   * Resolution + fps of screencast track, one of: `VGA`, `HD5`, `HD15`, `FHD15`, `FHD30`.
   * Note that quality might be worse than specified due to device capabilities, internet
   * connection etc.
   * @default `HD15``
   */
  quality: ScreencastQuality;
  /**
   *  bandwidth limit of a screencast track. By default there is no bandwidth limit.
   */
  maxBandwidth: TrackBandwidthLimit;
};
export type ScreencastOptionsInternal = {
  screencastMetadata: TrackMetadata & { displayName?: string };
  /**
   * SimulcastConfig of a screencast track. By default simulcast is disabled.
   */
  simulcastConfig: SimulcastConfig;
};

const defaultSimulcastConfig = () => ({
  enabled: false,
  activeEncodings: [],
});

let screencastSimulcastConfig: SimulcastConfig = defaultSimulcastConfig();

/**
 * This hook can toggle screen sharing on/off and provides current screencast state.
 * @returns An object with functions to manage screencast.
 */
export function useScreencast() {
  const [isScreencastOn, setIsScreencastOn] = useState<IsScreencastOnEvent>({
    IsScreencastOn: RNFishjamClientModule.isScreencastOn,
  });

  const [simulcastConfig, setSimulcastConfig] = useState<SimulcastConfig>(
    screencastSimulcastConfig,
  );

  useFishjamEvent<IsScreencastOnEvent>(
    ReceivableEvents.IsScreencastOn,
    setIsScreencastOn,
  );

  /**
   * Toggles the screencast on/off
   */
  const toggleScreencast = useCallback(
    async (screencastOptions: Partial<ScreencastOptions> = {}) => {
      const options = {
        ...screencastOptions,
        screencastMetadata: {
          displayName: 'presenting',
          type: 'screensharing' as const,
          active: !isScreencastOn,
        },
      };
      await RNFishjamClientModule.toggleScreencast(options);
      screencastSimulcastConfig = defaultSimulcastConfig(); //to do: sync with camera settings
      setSimulcastConfig(screencastSimulcastConfig);
    },
    [isScreencastOn],
  );

  /**
   * Toggles simulcast encoding of a screencast track on/off
   * @param encoding encoding to toggle
   */
  const toggleScreencastTrackEncoding = useCallback(
    async (encoding: TrackEncoding) => {
      screencastSimulcastConfig =
        await RNFishjamClientModule.toggleScreencastTrackEncoding(encoding);
      setSimulcastConfig(screencastSimulcastConfig);
    },
    [],
  );

  /**
   * updates maximum bandwidth for the given simulcast encoding of the screencast track
   * @param encoding encoding to update
   * @param bandwidth BandwidthLimit to set
   */
  const setScreencastTrackEncodingBandwidth = useCallback(
    async (encoding: TrackEncoding, bandwidth: BandwidthLimit) => {
      await RNFishjamClientModule.setScreencastTrackEncodingBandwidth(
        encoding,
        bandwidth,
      );
    },
    [],
  );

  /**
   * updates maximum bandwidth for the screencast track. This value directly translates
   * to quality of the stream and the amount of RTP packets being sent. In case simulcast
   * is enabled bandwidth is split between all of the variant streams proportionally to
   * their resolution
   * @param bandwidth BandwidthLimit to set
   */
  const setScreencastTrackBandwidth = useCallback(
    async (bandwidth: BandwidthLimit) => {
      await RNFishjamClientModule.setScreencastTrackBandwidth(bandwidth);
    },
    [],
  );

  const handleScreencastPermission = useCallback(async () => {
    if (Platform.OS == 'android') {
      return await RNFishjamClientModule.handleScreencastPermission();
    }
    return 'denied';
  }, []);

  return {
    isScreencastOn: isScreencastOn.IsScreencastOn,
    toggleScreencast,
    toggleScreencastTrackEncoding,
    simulcastConfig,
    setScreencastTrackEncodingBandwidth,
    setScreencastTrackBandwidth,
    handleScreencastPermission,
  };
}
