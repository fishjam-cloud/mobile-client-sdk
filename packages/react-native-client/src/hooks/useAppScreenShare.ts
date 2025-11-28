import { useCallback } from 'react';
import RNFishjamClientModule, {
  ReceivableEvents,
} from '../RNFishjamClientModule';
import { ScreenShareOptions } from './useScreenShare';
import { Platform } from 'react-native';
import { useFishjamEventState } from './internal/useFishjamEventState';

export type AppScreenShareData = {
  isAppScreenShareOn: boolean;
  toggleAppScreenShare: (
    screenShareOptions?: Partial<ScreenShareOptions>,
  ) => Promise<void>;
};

function useIosAppScreenShare(): AppScreenShareData {
  const isAppScreenShareOn = useFishjamEventState(
    ReceivableEvents.IsAppScreenShareOn,
    RNFishjamClientModule.isAppScreenShareOn,
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
    },
    [isAppScreenShareOn],
  );

  return {
    isAppScreenShareOn,
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
