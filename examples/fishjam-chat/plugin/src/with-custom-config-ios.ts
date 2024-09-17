import { ConfigPlugin, withPodfile } from '@expo/config-plugins';

function replaceCloudClientForExtension(podfileContent: string) {
  const targetName = 'FishjamScreenBroadcastExtension';
  const podToReplace = "pod 'FishjamCloudClient/Broadcast'";
  const replacementPod =
    "pod 'FishjamCloudClient/Broadcast', :path => '../../../'";

  const targetRegex = new RegExp(
    `target '${targetName}' do[\\s\\S]*?${podToReplace}[\\s\\S]*?end`,
    'g',
  );

  podfileContent = podfileContent.replace(targetRegex, (match) => {
    return match.replace(podToReplace, replacementPod);
  });
  return podfileContent;
}

function replaceCloudClientForMainApp(podfileContent: string) {
  podfileContent = podfileContent.replace(
    /target ['"]FishjamChat['"] do/g,
    (match) => `${match}\n  pod 'FishjamCloudClient', :path => '../../../'`,
  );
  return podfileContent;
}

export const withCustomConfigIOS: ConfigPlugin = (config) => {
  config = withPodfile(config, (config) => {
    let podfile = config.modResults.contents;

    podfile = replaceCloudClientForExtension(podfile);
    podfile = replaceCloudClientForMainApp(podfile);

    config.modResults.contents = podfile;
    return config;
  });

  return config;
};
