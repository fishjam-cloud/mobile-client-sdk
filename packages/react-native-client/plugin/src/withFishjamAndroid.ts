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

    const fishjamService = {
      $: {
        'android:name':
          'io.fishjam.reactnative.foregroundService.FishjamForegroundService',
        'android:foregroundServiceType': 'camera|microphone|mediaProjection',
        'android:stopWithTask': 'true',
      },
    };

    const whipWhepService = {
      $: {
        'android:name':
          'com.swmansion.reactnativeclient.foregroundService.ScreenCaptureService',
        'android:foregroundServiceType': 'mediaProjection',
        'android:stopWithTask': 'true',
      },
    };

    // Add Fishjam service
    const existingFishjamServiceIndex = mainApplication.service.findIndex(
      (service) => service.$['android:name'] === fishjamService.$['android:name'],
    );

    if (existingFishjamServiceIndex !== -1) {
      mainApplication.service[existingFishjamServiceIndex] = fishjamService;
    } else {
      mainApplication.service.push(fishjamService);
    }

    // Add WhipWhep service
    const existingWhipWhepServiceIndex = mainApplication.service.findIndex(
      (service) => service.$['android:name'] === whipWhepService.$['android:name'],
    );

    if (existingWhipWhepServiceIndex !== -1) {
      mainApplication.service[existingWhipWhepServiceIndex] = whipWhepService;
    } else {
      mainApplication.service.push(whipWhepService);
    }

    return configuration;
  });

const withFishjamForegroundServicePermission: ConfigPlugin<FishjamPluginOptions> = (
  config,
  props,
) =>
  withAndroidManifest(config, (configuration) => {
    if (!props?.android?.enableForegroundService) {
      return configuration;
    }

    const mainApplication = configuration.modResults;
    if (!mainApplication.manifest) {
      return configuration;
    }

    if (!mainApplication.manifest['uses-permission']) {
      mainApplication.manifest['uses-permission'] = [];
    }

    const permissions = mainApplication.manifest['uses-permission'];

    const hasForegroundServicePermission = permissions.some(
      (perm) => perm.$?.['android:name'] === 'android.permission.FOREGROUND_SERVICE',
    );

    if (!hasForegroundServicePermission) {
      permissions.push({
        $: {
          'android:name': 'android.permission.FOREGROUND_SERVICE',
        },
      });
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
  config = withFishjamForegroundServicePermission(config, props);
  config = withFishjamForegroundService(config, props);
  config = withFishjamPictureInPicture(config, props);
  return config;
};
