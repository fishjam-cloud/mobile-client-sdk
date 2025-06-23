import RNFishjamClient from '../RNFishjamClientModule';
import { createPermissionHook, PermissionResponse } from 'expo-modules-core';

/**
 * Checks user's permissions for accessing camera.
 * @return A promise that resolves to an object of type [PermissionResponse](#permissionresponse).
 */
async function getCameraPermissionsAsync(): Promise<PermissionResponse> {
  return RNFishjamClient.getCameraPermissionsAsync();
}

/**
 * Asks the user to grant permissions for accessing camera.
 * On iOS this will require apps to specify an `NSCameraUsageDescription` entry in the **Info.plist**.
 * @return A promise that resolves to an object of type [PermissionResponse](#permissionresponse).
 */
async function requestCameraPermissionsAsync(): Promise<PermissionResponse> {
  return RNFishjamClient.requestCameraPermissionsAsync();
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
 * Checks user's permissions for accessing microphone.
 * @return A promise that resolves to an object of type [PermissionResponse](#permissionresponse).
 */
async function getMicrophonePermissionsAsync(): Promise<PermissionResponse> {
  return RNFishjamClient.getMicrophonePermissionsAsync();
}

/**
 * Asks the user to grant permissions for accessing the microphone.
 * On iOS this will require apps to specify an `NSMicrophoneUsageDescription` entry in the **Info.plist**.
 * @return A promise that resolves to an object of type [PermissionResponse](#permissionresponse).
 */
async function requestMicrophonePermissionsAsync(): Promise<PermissionResponse> {
  return RNFishjamClient.requestMicrophonePermissionsAsync();
}

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
