import { ConfigPlugin, withAndroidManifest } from '@expo/config-plugins';
import { getMainApplicationOrThrow } from '@expo/config-plugins/build/android/Manifest';
import { FishjamPluginOptions } from './types';

const withFishjamForegroundService: ConfigPlugin = (config) => {
  return withAndroidManifest(config, async (config) => {
    const mainApplication = getMainApplicationOrThrow(config.modResults);
    mainApplication.service = mainApplication.service || [];

    const newService = {
      $: {
        'android:name':
          'org.membraneframework.reactnative.FishjamForegroundService',
        'android:foregroundServiceType': 'camera|microphone|mediaProjection',
      },
    };

    const existingServiceIndex = mainApplication.service.findIndex(
      (service) => service.$['android:name'] === newService.$['android:name'],
    );

    if (existingServiceIndex !== -1) {
      mainApplication.service[existingServiceIndex] = newService;
    } else {
      mainApplication.service.push(newService);
    }

    return config;
  });
};

export const withFishjamAndroid: ConfigPlugin<FishjamPluginOptions> = (
  config,
  { android: { enableForegroundService } },
) => {
  if (enableForegroundService) {
    config = withFishjamForegroundService(config);
  }
  return config;
};
