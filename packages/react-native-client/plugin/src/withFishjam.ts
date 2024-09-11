import { ConfigPlugin } from '@expo/config-plugins';
import { withFishjamAndroid } from './withFishjamAndroid';

// type FishjamPluginOptions = {
//   android:
// } | void;

const withFishjam: ConfigPlugin = (config) => {
  withFishjamAndroid(config);
  return config;
};

export default withFishjam;
