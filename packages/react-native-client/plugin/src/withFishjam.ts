import { ConfigPlugin } from '@expo/config-plugins';
import { withFishjamAndroid } from './withFishjamAndroid';
import { FishjamPluginOptions } from './types';
import withFishjamIOS from './withFishjamIOS';

const withFishjam: ConfigPlugin<FishjamPluginOptions> = (config, options) => {
  withFishjamAndroid(config, options);
  withFishjamIOS(config, options);
  return config;
};

export default withFishjam;
