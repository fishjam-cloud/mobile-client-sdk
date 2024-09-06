import { isDevice } from 'expo-device';
import { Alert, Platform } from 'react-native';

export const isIosSimulator = Platform.OS === 'ios' && !isDevice;

export function displayIosSimulatorCameraAlert() {
  Alert.alert(
    'Camera not supported on iOS simulator',
    'Please run the app on a real device to use the camera',
  );
}
