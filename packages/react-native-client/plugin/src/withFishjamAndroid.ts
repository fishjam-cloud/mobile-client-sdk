import { ConfigPlugin, withAndroidManifest } from '@expo/config-plugins';
import { getMainApplicationOrThrow } from '@expo/config-plugins/build/android/Manifest';
import { FishjamPluginOptions } from './types';

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

export const withFishjamAndroid: ConfigPlugin<FishjamPluginOptions> = (
  config,
  options,
) => {
  if (options.android.enableForegroundService) {
    config = withFishjamForegroundService(config);
  }
  return config;
};
