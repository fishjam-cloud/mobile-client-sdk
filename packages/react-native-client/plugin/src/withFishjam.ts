import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
} from '@expo/config-plugins';
import { getMainApplicationOrThrow } from '@expo/config-plugins/build/android/Manifest';
import { ExpoConfig } from '@expo/config-types';

export const withFishjamForegroundService: ConfigPlugin = (config) => {
  return withAndroidManifest(config, async (config) => {
    config.modResults = await setFishjamServiceAsync(config, config.modResults);
    return config;
  });
};

async function setFishjamServiceAsync(
  config: Pick<ExpoConfig, 'android'>,
  androidManifest: AndroidConfig.Manifest.AndroidManifest,
): Promise<AndroidConfig.Manifest.AndroidManifest> {
  const mainApplication = getMainApplicationOrThrow(androidManifest);

  mainApplication.service = mainApplication.service || [];

  mainApplication.service.push({
    $: {
      'android:name':
        'org.membraneframework.reactnative.FishjamForegroundService',
      'android:foregroundServiceType': 'camera|microphone|mediaProjection',
    } as any, // TODO:,
  });

  return androidManifest;
}

export const withFishjamAndroid: ConfigPlugin = (config) => {
  config = AndroidConfig.Permissions.withPermissions(config, [
    'android.permission.CAMERA',
    'android.permission.RECORD_AUDIO',
    'android.permission.MODIFY_AUDIO_SETTINGS',
    'android.permission.FOREGROUND_SERVICE',
    'android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION',
    'android.permission.FOREGROUND_SERVICE_CAMERA',
    'android.permission.FOREGROUND_SERVICE_MICROPHONE',
  ]);
  config = withFishjamForegroundService(config);
  return config;
};

const withFishjam: ConfigPlugin = (config) => {
  withFishjamAndroid(config);
  return config;
};

export default withFishjam;
