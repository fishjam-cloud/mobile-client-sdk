import { ConfigPlugin } from '@expo/config-plugins';
import { withFishjamAndroid } from './withFishjamAndroid';
import { FishjamPluginOptions } from './types';
import withFishjamIos from './withFishjamIos';

const withFishjam: ConfigPlugin<FishjamPluginOptions> = (config, options) => {
  withFishjamAndroid(config, options);
  withFishjamIos(config, options);
  return config;
};

export default withFishjam;
