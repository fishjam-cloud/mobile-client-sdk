import { ConfigPlugin } from '@expo/config-plugins';
import { withFishjamAndroid } from './withFishjamAndroid';
import { FishjamPluginOptions } from './types';
import withFishjamIos from './withFishjamIos';

/**
 * Main Fishjam Expo config plugin.
 *
 * This plugin configures both iOS and Android platforms for Fishjam video calls
 * and optionally for livestreaming functionality.
 *
 * ## Basic Usage (Video Calls)
 *
 * ```json
 * {
 *   "plugins": [
 *     [
 *       "@fishjam-cloud/react-native-client",
 *       {
 *         "android": {
 *           "enableForegroundService": true,
 *           "supportsPictureInPicture": true
 *         },
 *         "ios": {
 *           "enableScreensharing": true,
 *           "enableVoIPBackgroundMode": true,
 *           "supportsPictureInPicture": true
 *         }
 *       }
 *     ]
 *   ]
 * }
 * ```
 *
 * ## Livestreaming Support
 *
 * If you're using the livestream functionality (WHIP/WHEP), add the `livestream` configuration.
 * This will automatically configure the underlying `react-native-whip-whep` package:
 *
 * ```json
 * {
 *   "plugins": [
 *     [
 *       "@fishjam-cloud/react-native-client",
 *       {
 *         "android": {
 *           "enableForegroundService": true,
 *           "supportsPictureInPicture": true
 *         },
 *         "ios": {
 *           "enableScreensharing": true,
 *           "enableVoIPBackgroundMode": true,
 *           "supportsPictureInPicture": true
 *         },
 *         "livestream": {
 *           "android": {
 *             "enableScreensharing": true,
 *             "supportsPictureInPicture": true
 *           },
 *           "ios": {
 *             "enableScreensharing": true,
 *             "supportsPictureInPicture": true
 *           }
 *         }
 *       }
 *     ]
 *   ]
 * }
 * ```
 *
 * The `livestream` configuration adds:
 * - **Android**: ScreenCaptureService for screen sharing in livestreams
 * - **iOS**: Broadcast extension for screen sharing in livestreams
 *
 * @param config - Expo config object
 * @param options - Plugin configuration options
 * @returns Modified config object
 */
const withFishjam: ConfigPlugin<FishjamPluginOptions> = (config, options) => {
  config = withFishjamAndroid(config, options);
  config = withFishjamIos(config, options);

  if (options?.livestream) {
    try {
      const withWhipWhep = require('react-native-whip-whep/plugin/build/withWhipWhep').default;
      
      // Fishjam's iOS screensharing is enabled, disable whip-whep's screensharing
      // This ensures only one broadcast extension is created (Fishjam's FishjamScreenBroadcastExtension)
      // to avoid duplicate broadcast extension targets in the Xcode project
      if (options?.ios?.enableScreensharing) {
        options.livestream.ios = {
          ...options.livestream.ios,
          enableScreensharing: false,
        };
      }
      
      config = withWhipWhep(config, options.livestream);
    } catch (error) {
      console.warn(
        '[Fishjam] react-native-whip-whep plugin not found. Livestream configuration will be skipped. ' +
          'Make sure react-native-whip-whep is installed if you need livestream functionality.',
      );
    }
  }

  return config;
};

export default withFishjam;
