import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
} from '@expo/config-plugins';
import { getMainApplicationOrThrow } from '@expo/config-plugins/build/android/Manifest';

const withFishjamForegroundService: ConfigPlugin = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;

    const mainApplication = getMainApplicationOrThrow(androidManifest);
    mainApplication.service = mainApplication.service || [];
    mainApplication.service.push({
      $: {
        'android:name':
          'org.membraneframework.reactnative.FishjamForegroundService',
        'android:foregroundServiceType': 'camera|microphone|mediaProjection',
      } as any, // TODO: android:foregroundServiceTyp type not supported
    });

    config.modResults = androidManifest;

    return config;
  });
};

const withFishjamPermissions: ConfigPlugin = (config) => {
  config = AndroidConfig.Permissions.withPermissions(config, [
    'android.permission.CAMERA',
    'android.permission.RECORD_AUDIO',
    'android.permission.MODIFY_AUDIO_SETTINGS',
    'android.permission.FOREGROUND_SERVICE',
    'android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION',
    'android.permission.FOREGROUND_SERVICE_CAMERA',
    'android.permission.FOREGROUND_SERVICE_MICROPHONE',
  ]);
  return config;
};

export const withFishjamAndroid: ConfigPlugin = (config) => {
  config = withFishjamPermissions(config);
  config = withFishjamForegroundService(config);
  return config;
};
