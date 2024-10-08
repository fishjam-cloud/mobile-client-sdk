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

type AppScreenShareData = {
  isAppScreenShareOn: boolean;
  simulcastConfig: SimulcastConfig;
  toggleAppScreenShare: (
    screenShareOptions?: Partial<ScreenShareOptions>,
  ) => Promise<void>;
};

/**
 * This hook can toggle client app screen sharing on/off and provides current screen share state. It works only on iOS.
 * @returns An object with functions to manage app screen share on iOS and null on android.
 * @category Screenshare
 * @group Hooks
 */
function useIosAppScreenShare(): AppScreenShareData {
  const [isAppScreenShareOn, setIsAppScreenShareOn] = useState(
    RNFishjamClientModule.isAppScreenShareOn,
  );

  const [simulcastConfig, setSimulcastConfig] = useState<SimulcastConfig>(
    screenShareSimulcastConfig,
  );

  useFishjamEvent(ReceivableEvents.IsAppScreenShareOn, setIsAppScreenShareOn);

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

function useDefaultAppScreenShareAndroid(): AppScreenShareData {
  return {
    isAppScreenShareOn: false,
    simulcastConfig: defaultSimulcastConfig(),
    toggleAppScreenShare: async () => {},
  };
}

export const useAppScreenShare = Platform.select({
  ios: useIosAppScreenShare,
  default: useDefaultAppScreenShareAndroid,
});
