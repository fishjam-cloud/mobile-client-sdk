import { useCallback, useState } from 'react';
import RNFishjamClientModule from '../RNFishjamClientModule';
import { SimulcastConfig } from '../types';
import { ReceivableEvents, useFishjamEvent } from './useFishjamEvent';
import { ScreenShareOptions } from './useScreenShare';
import { Platform } from 'react-native';

const defaultSimulcastConfig = () => ({
  enabled: false,
  activeEncodings: [],
});

let screenShareSimulcastConfig: SimulcastConfig = defaultSimulcastConfig();

/**
 * This hook can toggle client app screen sharing on/off and provides current screen share state. It works only on iOS.
 * @returns An object with functions to manage app screen share on iOS and null on android.
 * @category Screenshare
 * @group Hooks
 */
export function useAppScreenShare(): {
  isAppScreenShareOn: boolean;
  simulcastConfig: SimulcastConfig;
  toggleAppScreenShare: (
    screenShareOptions?: Partial<ScreenShareOptions>,
  ) => Promise<void>;
} | null {
  if (Platform.OS === 'android') return null;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [isAppScreenShareOn, setIsAppScreenShareOn] = useState(
    RNFishjamClientModule.isAppScreenShareOn,
  );

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [simulcastConfig, setSimulcastConfig] = useState<SimulcastConfig>(
    screenShareSimulcastConfig,
  );

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useFishjamEvent(ReceivableEvents.IsAppScreenShareOn, setIsAppScreenShareOn);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const toggleAppScreenShare = useCallback(
    async (screenShareOptions: Partial<ScreenShareOptions> = {}) => {
      const options = {
        ...screenShareOptions,
        screenShareMetadata: {
          displayName: 'presenting',
          type: 'screensharing' as const,
          active: !isAppScreenShareOn,
        },
      };
      await RNFishjamClientModule.toggleAppScreenShare(options);
      screenShareSimulcastConfig = defaultSimulcastConfig(); //to do: sync with camera settings
      setSimulcastConfig(screenShareSimulcastConfig);
    },
    [isAppScreenShareOn],
  );

  return {
    isAppScreenShareOn,
    simulcastConfig,

    /**
     * Toggles the screen share on/off.
     * Emits warning on ios when user is screensharing full screen.
     */
    toggleAppScreenShare,
  };
}
