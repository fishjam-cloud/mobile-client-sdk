import { ConfigPlugin } from '@expo/config-plugins';
import { withFishjamAndroid } from './withFishjamAndroid';

const withFishjam: ConfigPlugin = (config) => {
  withFishjamAndroid(config);
  return config;
};

export default withFishjam;
