import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import RNFishjamClient, { ReceivableEvents } from '../RNFishjamClientModule';
import { useFishjamEvent } from './internal/useFishjamEvent';

export type CallKitAction = {
  ['started']: undefined;
  ['ended']: undefined;
  ['failed']: string;
  ['muted']: boolean;
  ['held']: boolean;
};

export type UseCallKitResult = {
  /**
   * Starts a CallKit session for the current call
   * @param config - Configuration object containing displayName and isVideo
   */
  startCallKitSession: (config: CallKitConfig) => Promise<void>;

  /**
   * Ends the current CallKit session
   */
  endCallKitSession: () => Promise<void>;

  /**
   * Returns whether there is currently an active CallKit session
   */
  getCallKitSessionStatus: () => Promise<boolean>;
};

export type CallKitConfig = {
  /**
   * The name to display in the CallKit UI
   */
  displayName: string;
  /**
   * Whether the should support video
   */
  isVideo: boolean;
};

function useCallKitIos(): UseCallKitResult {
  const startCallKitSession = useCallback(
    async ({ displayName, isVideo }: CallKitConfig) => {
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

const useCallKitServiceIos = (config: CallKitConfig) => {
  const { displayName, isVideo } = config;

  const { startCallKitSession, endCallKitSession } = useCallKitIos();

  useEffect(() => {
    startCallKitSession({ displayName, isVideo });

    return () => {
      endCallKitSession();
    };
  }, [startCallKitSession, endCallKitSession, displayName, isVideo]);
};

const emptyFunction = () => {};

const useCallKitEventIos = <T extends keyof CallKitAction>(
  action: T,
  callback: (event: CallKitAction[T]) => void,
) => {
  useFishjamEvent(ReceivableEvents.CallKitActionPerformed, (event) => {
    event[action] && callback(event[action]);
  });
};

/**
 * A hook for listening to CallKit actions on iOS. Does nothing on other platforms.
 * This hook allows you to respond to user interactions with the native iOS CallKit interface,
 * such as muting/unmuting the call, putting the call on hold, or ending the call from the
 * system's phone UI or lock screen controls.
 *
 * @param {keyof CallKitAction} action - The CallKit action to listen for. Available actions:
 *  - `'started'` - CallKit session has started
 *  - `'ended'` - User ended the call from CallKit UI
 *  - `'failed'` - CallKit session failed to start
 *  - `'muted'` - User toggled mute from CallKit UI
 *  - `'held'` - User toggled hold from CallKit UI
 *
 * @param {Function} callback - Function called when the specified action occurs.
 *
 * @group Hooks
 * @category Connection
 *
 * @example
 * ```typescript
 * import { useCallKitEvent } from '@fishjam-cloud/react-native-client';
 *
 * // Listen for hold state changes
 * useCallKitEvent('held', (isOnHold: boolean) => {
 *   console.log('Call hold state:', isOnHold);
 *   // Handle hold state in your app
 * });
 * ```
 */
export const useCallKitEvent = Platform.select({
  ios: useCallKitEventIos,
  default: emptyFunction,
});

/**
 * A hook for managing CallKit sessions on iOS. Does nothing on other platforms.
 * CallKit provides a native iOS interface for managing VoIP calls, integrating with the system's
 * phone UI and controls. Use this hook when you need fine-grained control over the CallKit session lifecycle.
 *
 * @returns {UseCallKitResult} An object containing methods to manage CallKit sessions:
 *  - `startCallKitSession(config: CallKitConfig)` - Starts a CallKit session with the given configuration
 *  - `endCallKitSession()` - Ends the current CallKit session
 *  - `getCallKitSessionStatus()` - Returns whether there is currently an active CallKit session
 *
 * @group Hooks
 * @category Connection
 *
 * @example
 * ```typescript
 * import { useCallKit } from '@fishjam-cloud/react-native-client';
 *
 * const { startCallKitSession, endCallKitSession } = useCallKit();
 *
 * // Start a CallKit session
 * await startCallKitSession({ displayName: 'John Doe', isVideo: true });
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
 * @param {CallKitConfig} config - Configuration object containing:
 *  - `displayName` - The name to display in the CallKit UI (e.g., username, call title)
 *  - `isVideo` - Whether the call is video or audio only
 *
 * @group Hooks
 * @category Connection
 *
 * @example
 * ```typescript
 * import { useCallKitService } from '@fishjam-cloud/react-native-client';
 * import { View } from 'react-native';
 *
 * function CallScreen({ username }: { username: string }) {
 *   // CallKit session will automatically start when this component mounts
 *   // and end when it unmounts
 *   useCallKitService({ displayName: username, isVideo: true });
 *
 *   return <View>...</View>;
 * }
 * ```
 */
export const useCallKitService = Platform.select({
  ios: useCallKitServiceIos,
  default: emptyFunction,
});
