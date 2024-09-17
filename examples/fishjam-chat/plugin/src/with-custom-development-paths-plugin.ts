import { ConfigPlugin } from '@expo/config-plugins';
import { withCustomConfigIOS } from './with-custom-config-ios';
import { withCustomConfigAndroid } from './with-custom-config-android';

const withCustomDevelopmentPaths: ConfigPlugin = (config) => {
  config = withCustomConfigIOS(config);
  config = withCustomConfigAndroid(config);

  return config;
};

export default withCustomDevelopmentPaths;