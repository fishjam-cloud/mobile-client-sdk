import { ConfigPlugin, withPodfile } from '@expo/config-plugins';

const withCustomPodfile: ConfigPlugin = (config) => {
  return withPodfile(config, async (config) => {
    let podfile = config.modResults.contents;

    const targetName = 'FishjamScreenBroadcastExtension';
    const podToReplace = "pod 'FishjamCloudClient/Broadcast'";
    const replacementPod =
      "pod 'FishjamCloudClient/Broadcast', :path => '../../../'";

    const targetRegex = new RegExp(
      `target '${targetName}' do[\\s\\S]*?${podToReplace}[\\s\\S]*?end`,
      'g',
    );

    podfile = podfile.replace(targetRegex, (match) => {
      return match.replace(podToReplace, replacementPod);
    });

    podfile = podfile.replace(
      /target ['"]FishjamChat['"]/g,
      (match) => `${match}\n  pod 'FishjamCloudClient', :path => '../../../'`,
    );

    config.modResults.contents = podfile;
    return config;
  });
};

export default withCustomPodfile;
