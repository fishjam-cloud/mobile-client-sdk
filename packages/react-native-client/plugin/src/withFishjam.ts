import { ConfigPlugin } from '@expo/config-plugins';
import { withFishjamAndroid } from './withFishjamAndroid';
import { FishjamPluginOptions } from './types';

const withFishjam: ConfigPlugin<FishjamPluginOptions> = (config, options) => {
  withFishjamAndroid(config, options);
  return config;
};

export default withFishjam;
