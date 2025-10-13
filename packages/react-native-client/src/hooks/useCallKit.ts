import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import RNFishjamClient from '../RNFishjamClientModule';

export type UseCallKitResult = {
  /**
   * Starts a CallKit session for the current call
   * @param displayName - Name to display in the CallKit UI
   * @param isVideo - Whether the call is video or audio only
   */
  startCallKitSession: (displayName: string, isVideo: boolean) => Promise<void>;

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
  const startCallKitSession = useCallback(
    async (displayName: string, isVideo: boolean) => {
      try {
        await RNFishjamClient.startCallKitSession(displayName, isVideo);
      } catch (error) {
        console.error('Failed to start CallKit session:', error);
        throw error;
      }
    },
    [],
  );

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

const useCallKitServiceIos = (displayName: string, isVideo: boolean) => {
  const { startCallKitSession, endCallKitSession } = useCallKitIos();

  useEffect(() => {
    startCallKitSession(displayName, isVideo);

    return () => {
      endCallKitSession();
    };
  }, [startCallKitSession, endCallKitSession, displayName, isVideo]);
};

const emptyFunction = () => {};

/**
 * A hook for managing CallKit sessions on iOS. Does nothing on other platforms.
 * CallKit provides a native iOS interface for managing VoIP calls, integrating with the system's
 * phone UI and controls. Use this hook when you need fine-grained control over the CallKit session lifecycle.
 *
 * @returns {UseCallKitResult} An object containing methods to manage CallKit sessions:
 *  - `startCallKitSession(displayName: string)` - Starts a CallKit session with the given display name
 *  - `endCallKitSession()` - Ends the current CallKit session
 *  - `getCallKitSessionStatus()` - Returns whether there is currently an active CallKit session
 *
 * @group Hooks
 * @category Connection
 *
 * @example
 * ```typescript
 * const { startCallKitSession, endCallKitSession } = useCallKit();
 *
 * // Start a CallKit session
 * await startCallKitSession('John Doe');
 *
 * // Later, end the session
 * await endCallKitSession();
 * ```
 */
export const useCallKit = Platform.select({
  ios: useCallKitIos,
  default: emptyFunction,
});

/**
 * A convenience hook for automatically managing CallKit session lifecycle on iOS. Does nothing on other platforms.
 * This hook automatically starts a CallKit session when the component mounts and ends it when the component unmounts.
 * Use this hook when you want CallKit to be active for the entire lifetime of a component (e.g., during a call).
 *
 * @param {string} displayName - The name to display in the CallKit UI (e.g., username, call title)
 *
 * @group Hooks
 * @category Connection
 *
 * @example
 * ```typescript
 * function CallScreen({ username }) {
 *   // CallKit session will automatically start when this component mounts
 *   // and end when it unmounts
 *   useCallKitService(username);
 *
 *   return <View>...</View>;
 * }
 * ```
 */
export const useCallKitService = Platform.select({
  ios: useCallKitServiceIos,
  default: emptyFunction,
});
