import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
} from '@expo/config-plugins';
import { getMainApplicationOrThrow } from '@expo/config-plugins/build/android/Manifest';
import { FishjamPluginOptions } from './types';

const withFishjamForegroundService: ConfigPlugin<FishjamPluginOptions> = (
  config,
  props,
) =>
  withAndroidManifest(config, async (configuration) => {
    if (!props?.android?.enableForegroundService) {
      return configuration;
    }

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

const withFishjamPictureInPicture: ConfigPlugin<FishjamPluginOptions> = (
  config,
  props,
) =>
  withAndroidManifest(config, (configuration) => {
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(
      configuration.modResults,
    );

    if (props?.android?.supportsPictureInPicture) {
      activity.$['android:supportsPictureInPicture'] = 'true';
    } else {
      delete activity.$['android:supportsPictureInPicture'];
    }
    return configuration;
  });

export const withFishjamAndroid: ConfigPlugin<FishjamPluginOptions> = (
  config,
  props,
) => {
  config = withFishjamForegroundService(config, props);
  config = withFishjamPictureInPicture(config, props);
  return config;
};
