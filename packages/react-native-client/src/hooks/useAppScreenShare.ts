import { useCallback } from 'react';
import RNFishjamClientModule, {
  ReceivableEvents,
} from '../RNFishjamClientModule';
import { SimulcastConfig } from '../types';
import { ScreenShareOptions } from './useScreenShare';
import { Platform } from 'react-native';
import { useFishjamEventState } from './internal/useFishjamEventState';

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

function useIosAppScreenShare(): AppScreenShareData {
  const isAppScreenShareOn = useFishjamEventState<boolean>(
    ReceivableEvents.IsAppScreenShareOn,
    RNFishjamClientModule.isAppScreenShareOn,
  );

  const simulcastConfig = useFishjamEventState<SimulcastConfig>(
    ReceivableEvents.SimulcastConfigUpdate,
    screenShareSimulcastConfig,
  );

  const toggleAppScreenShare = useCallback(
    async (screenShareOptions: Partial<ScreenShareOptions> = {}) => {
      const options = {
        ...screenShareOptions,
        screenShareMetadata: {
          displayName: 'presenting',
          type: 'screenShareVideo' as const,
          active: !isAppScreenShareOn,
        },
      };
      await RNFishjamClientModule.toggleAppScreenShare(options);
      screenShareSimulcastConfig = defaultSimulcastConfig(); //to do: sync with camera settings
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

/**
 * This hook can toggle client app screen sharing on/off and provides current screen share state.
 *
 * It works only on iOS.
 *
 * @returns An object with functions to manage app screen share on iOS and null on android.
 * @category Connection
 * @group Hooks
 */
export const useAppScreenShare = Platform.select({
  ios: useIosAppScreenShare,
  default: useDefaultAppScreenShareAndroid,
});
