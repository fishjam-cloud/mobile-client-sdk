import { useCallback } from 'react';

import { SimulcastConfig, TrackMetadata } from '../types';
import RNFishjamClientModule, {
  ReceivableEvents,
} from '../RNFishjamClientModule';
import { Platform } from 'react-native';
import { useFishjamEventState } from './internal/useFishjamEventState';

export type ScreenShareQuality = 'VGA' | 'HD5' | 'HD15' | 'FHD15' | 'FHD30';

export type ScreenShareOptions = {
  /**
   * Resolution + fps of screen share track, one of: `VGA`, `HD5`, `HD15`, `FHD15`, `FHD30`.
   * Note that quality might be worse than specified due to device capabilities, internet
   * connection etc.
   * @default `HD15`
   */
  quality: ScreenShareQuality;
};
export type ScreenShareOptionsInternal = {
  screenShareMetadata: TrackMetadata & { displayName?: string };
  /**
   * @deprecated Simulcast is no longer supported
   */
  simulcastConfig?: SimulcastConfig;
};

/**
 * This hook can toggle screen sharing on/off and provides current screen share state.
 * @returns An object with functions to manage screen share.
 * @category Connection
 * @group Hooks
 */
export function useScreenShare() {
  const isScreenShareOn = useFishjamEventState(
    ReceivableEvents.IsScreenShareOn,
    RNFishjamClientModule.isScreenShareOn,
  );

  const handleScreenSharePermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      return await RNFishjamClientModule.handleScreenSharePermission();
    }
    return 'denied';
  }, []);

  const toggleScreenShare = useCallback(
    async (screenShareOptions: Partial<ScreenShareOptions> = {}) => {
      if (Platform.OS === 'android' && !isScreenShareOn) {
        if ((await handleScreenSharePermission()) !== 'granted') {
          return;
        }
      }
      const options = {
        ...screenShareOptions,
        screenShareMetadata: {
          displayName: 'presenting',
          type: 'screenShareVideo' as const,
          active: !isScreenShareOn,
        },
      };
      await RNFishjamClientModule.toggleScreenShare(options);
    },
    [isScreenShareOn, handleScreenSharePermission],
  );

  return {
    isScreenShareOn,

    /**
     * Toggles the screen share on/off
     * Emits warning on ios when user is screensharing app screen.
     */
    toggleScreenShare,
    handleScreenSharePermission,
  };
}
