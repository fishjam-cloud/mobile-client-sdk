import { ConfigPlugin } from '@expo/config-plugins';
import { withCustomConfigIos } from './with-custom-config-ios';
import { withCustomConfigAndroid } from './with-custom-config-android';

const withLocalPathsForNativePackages: ConfigPlugin = (config) => {
  config = withCustomConfigIos(config);
  config = withCustomConfigAndroid(config);

  return config;
};

export default withLocalPathsForNativePackages;
