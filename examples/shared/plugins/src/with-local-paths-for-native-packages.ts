import { ConfigPlugin } from "@expo/config-plugins";
import { withCustomConfigIos } from "./with-custom-config-ios";
import { withCustomConfigAndroid } from "./with-custom-config-android";

type PluginProps = {
  iosTargetName?: string;
};

const withLocalPathsForNativePackages: ConfigPlugin<PluginProps> = (
  config,
  props = {},
) => {
  const { iosTargetName } = props;

  config = withCustomConfigIos(config, { targetName: iosTargetName });
  config = withCustomConfigAndroid(config);

  return config;
};

export default withLocalPathsForNativePackages;
