import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import RNFishjamClient from '../RNFishjamClientModule';

export type UseCallKitResult = {
  /**
   * Starts a CallKit session for the current call
   * @param displayName - Name to display in the CallKit UI
   */
  startCallKitSession: (displayName: string) => Promise<void>;

  /**
   * Ends the current CallKit session
   */
  endCallKitSession: () => Promise<void>;

  /**
   * Whether there is currently an active CallKit session
   */
  getCallKitSessionStatus: () => Promise<boolean>;
};

function useCallKitIos(): UseCallKitResult {
  const startCallKitSession = useCallback(async (displayName: string) => {
    try {
      await RNFishjamClient.startCallKitSession(displayName);
    } catch (error) {
      console.error('Failed to start CallKit session:', error);
      throw error;
    }
  }, []);

  const endCallKitSession = useCallback(async () => {
    try {
      await RNFishjamClient.endCallKitSession();
    } catch (error) {
      console.error('Failed to end CallKit session:', error);
      throw error;
    }
  }, []);

  const getCallKitSessionStatus = useCallback(async () => {
    return RNFishjamClient.hasActiveCallKitSession;
  }, []);

  return {
    startCallKitSession,
    endCallKitSession,
    getCallKitSessionStatus,
  };
}

const useCallKitServiceIos = (displayName: string) => {
  const { startCallKitSession, endCallKitSession } = useCallKitIos();

  useEffect(() => {
    startCallKitSession(displayName);

    return () => {
      endCallKitSession();
    };
  }, [startCallKitSession, endCallKitSession, displayName]);
};

const emptyFunction = () => {};

export const useCallKit = Platform.select({
  ios: useCallKitIos,
  default: emptyFunction,
});

export const useCallKitService = Platform.select({
  ios: useCallKitServiceIos,
  default: emptyFunction,
});
