import RNFishjamClient from '../RNFishjamClientModule';

/**
 * Checks if camera permission is granted (does not prompt).
 * @returns Promise resolving to true if granted, false otherwise.
 */
export async function getCameraPermissionsAsync(): Promise<boolean> {
  try {
    const result = await RNFishjamClient.getCameraPermissionsAsync();
    return !!result?.granted;
  } catch {
    return false;
  }
}

/**
 * Requests camera permission (prompts the user).
 * @returns Promise resolving to true if granted, false otherwise.
 */
export async function requestCameraPermissionsAsync(): Promise<boolean> {
  try {
    const result = await RNFishjamClient.requestCameraPermissionsAsync();
    return !!result?.granted;
  } catch {
    return false;
  }
}
