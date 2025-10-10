import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import RNFishjamClient from '../RNFishjamClientModule';

/**
 * Configuration options for CallKit
 */
export type CallKitConfig = {
  /**
   * The localized name to display for calls (e.g., your app name)
   * @default "Fishjam"
   */
  localizedCallerName?: string;
};

/**
 * Hook return type
 */
export type UseCallKitResult = {
  /**
   * Enables CallKit integration
   * Should be called once during app initialization
   */
  enableCallKit: (config?: CallKitConfig) => Promise<void>;

  /**
   * Starts a CallKit session for the current call
   * @param handle - Unique identifier for the call (e.g., room name)
   * @param displayName - Name to display in the CallKit UI
   */
  startCallKitSession: (handle: string, displayName?: string) => Promise<void>;

  /**
   * Ends the current CallKit session
   */
  endCallKitSession: () => Promise<void>;

  /**
   * Whether CallKit is available on this platform (iOS 10.0+)
   */
  isCallKitAvailable: boolean;

  /**
   * Whether there is currently an active CallKit session
   */
  hasActiveSession: boolean;
};

/**
 * Hook for managing CallKit integration on iOS
 *
 * CallKit provides native iOS call UI and keeps the app active during calls.
 * This hook provides a convenient way to enable and control CallKit sessions.
 *
 * @example
 * ```tsx
 * import { useCallKit } from '@fishjam-cloud/react-native-client';
 *
 * function MyComponent() {
 *   const {
 *     enableCallKit,
 *     startCallKitSession,
 *     endCallKitSession,
 *     isCallKitAvailable,
 *     hasActiveSession
 *   } = useCallKit();
 *
 *   // Enable CallKit on mount
 *   useEffect(() => {
 *     if (isCallKitAvailable) {
 *       enableCallKit({ localizedCallerName: 'My App' });
 *     }
 *   }, []);
 *
 *   const joinCall = async (roomName: string) => {
 *     await client.joinRoom(...);
 *     if (isCallKitAvailable) {
 *       await startCallKitSession(roomName, 'Video Call');
 *     }
 *   };
 *
 *   const leaveCall = async () => {
 *     if (isCallKitAvailable && hasActiveSession) {
 *       await endCallKitSession();
 *     }
 *     await client.leaveRoom();
 *   };
 * }
 * ```
 *
 * @remarks
 * - CallKit is only available on iOS 10.0 and later
 * - You should enable CallKit once during app initialization
 * - Start a CallKit session immediately after joining a room
 * - End the CallKit session before leaving the room
 * - The CallKit manager automatically calls leaveRoom() when the user ends the call via native UI
 *
 * @see {@link https://developer.apple.com/documentation/callkit | Apple CallKit Documentation}
 */
export function useCallKit(): UseCallKitResult {
  const isCallKitAvailable = Platform.OS === 'ios';
  const [hasActiveSession, setHasActiveSession] = useState(false);

  // Update active session state
  useEffect(() => {
    if (!isCallKitAvailable) return;

    const checkSessionStatus = () => {
      setHasActiveSession(RNFishjamClient.hasActiveCallKitSession);
    };

    // Check initial status
    checkSessionStatus();

    // Poll for status changes (since we don't have an event for this yet)
    const interval = setInterval(checkSessionStatus, 1000);

    return () => clearInterval(interval);
  }, [isCallKitAvailable]);

  const enableCallKit = useCallback(
    async (config?: CallKitConfig) => {
      if (!isCallKitAvailable) {
        console.warn(
          'CallKit is only available on iOS. This method has no effect on other platforms.'
        );
        return;
      }

      try {
        await RNFishjamClient.enableCallKit(
          config?.localizedCallerName ?? 'Fishjam'
        );
      } catch (error) {
        console.error('Failed to enable CallKit:', error);
        throw error;
      }
    },
    [isCallKitAvailable]
  );

  const startCallKitSession = useCallback(
    async (handle: string, displayName?: string) => {
      if (!isCallKitAvailable) {
        console.warn(
          'CallKit is only available on iOS. This method has no effect on other platforms.'
        );
        return;
      }

      try {
        await RNFishjamClient.startCallKitSession(
          handle,
          displayName ?? 'Fishjam Call'
        );
        setHasActiveSession(true);
      } catch (error) {
        console.error('Failed to start CallKit session:', error);
        throw error;
      }
    },
    [isCallKitAvailable]
  );

  const endCallKitSession = useCallback(async () => {
    if (!isCallKitAvailable) {
      return;
    }

    try {
      await RNFishjamClient.endCallKitSession();
      setHasActiveSession(false);
    } catch (error) {
      console.error('Failed to end CallKit session:', error);
      throw error;
    }
  }, [isCallKitAvailable]);

  return {
    enableCallKit,
    startCallKitSession,
    endCallKitSession,
    isCallKitAvailable,
    hasActiveSession,
  };
}

