import { createPermissionHook } from './internal/useFishjamPermissions';
import RNFishjamClient from '../RNFishjamClientModule';
import { PermissionStatus } from '../types';

/**
 * Checks if camera permission is granted (does not prompt).
 */
export async function getCameraPermissionsAsync(): Promise<PermissionStatus> {
  try {
    return await RNFishjamClient.getCameraPermissionsAsync();
  } catch {
    return PermissionStatus.UNDETERMINED;
  }
}

/**
 * Requests camera permission (prompts the user).
 */
export async function requestCameraPermissionsAsync(): Promise<PermissionStatus> {
  try {
    return await RNFishjamClient.requestCameraPermissionsAsync();
  } catch {
    return PermissionStatus.UNDETERMINED;
  }
}

/**
 * Checks if microphone permission is granted (does not prompt).
 */
export async function getMicrophonePermissionsAsync(): Promise<PermissionStatus> {
  try {
    return await RNFishjamClient.getMicrophonePermissionsAsync();
  } catch {
    return PermissionStatus.UNDETERMINED;
  }
}

/**
 * Requests microphone permission (prompts the user).
 */
export async function requestMicrophonePermissionsAsync(): Promise<PermissionStatus> {
  try {
    return await RNFishjamClient.requestMicrophonePermissionsAsync();
  } catch {
    return PermissionStatus.UNDETERMINED;
  }
}

/**
 * Check or request permissions to access the camera.
 * This uses both `requestCameraPermissionsAsync` and `getCameraPermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = useCameraPermissions();
 * ```
 */
export const useCameraPermissions = createPermissionHook({
  getMethod: getCameraPermissionsAsync,
  requestMethod: requestCameraPermissionsAsync,
});

/**
 * Check or request permissions to access the microphone.
 * This uses both `requestMicrophonePermissionsAsync` and `getMicrophonePermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = useMicrophonePermissions();
 * ```
 */
export const useMicrophonePermissions = createPermissionHook({
  getMethod: getMicrophonePermissionsAsync,
  requestMethod: requestMicrophonePermissionsAsync,
});
