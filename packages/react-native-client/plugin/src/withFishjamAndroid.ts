import { ConfigPlugin, withAndroidManifest } from '@expo/config-plugins';
import { getMainApplicationOrThrow } from '@expo/config-plugins/build/android/Manifest';
import { FishjamPluginOptions } from './types';

const withFishjamForegroundService: ConfigPlugin = (config) =>
  withAndroidManifest(config, async (configuration) => {
    const mainApplication = getMainApplicationOrThrow(configuration.modResults);
    mainApplication.service = mainApplication.service || [];

    const newService = {
      $: {
        'android:name':
          'io.fishjam.reactnative.foregroundService.FishjamForegroundService',
        'android:foregroundServiceType': 'camera|microphone|mediaProjection',
        'android:stopWithTask': 'true',
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

    return configuration;
  });

export const withFishjamAndroid: ConfigPlugin<FishjamPluginOptions> = (
  config,
  props,
) => {
  if (props?.android?.enableForegroundService) {
    config = withFishjamForegroundService(config);
  }
  return config;
};
