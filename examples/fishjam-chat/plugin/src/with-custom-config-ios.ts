import { ConfigPlugin, withPodfile } from '@expo/config-plugins';
import { INFO_GENERATED_COMMENT_IOS } from './utils';

function replaceCloudClientForExtension(podfileContent: string) {
  const targetName = 'FishjamScreenBroadcastExtension';
  const podToReplace = "pod 'FishjamCloudClient/Broadcast'";
  const replacementPod = `
  ${INFO_GENERATED_COMMENT_IOS}
  pod 'FishjamCloudClient/Broadcast', :path => '../../../'`;

  const targetRegex = new RegExp(
    `target '${targetName}' do[\\s\\S]*?${podToReplace}[\\s\\S]*?end`,
    'g',
  );

  podfileContent = podfileContent.replace(targetRegex, (match) =>
    match.replace(podToReplace, replacementPod),
  );
  return podfileContent;
}

function replaceCloudClientForMainApp(podfileContent: string) {
  podfileContent = podfileContent.replace(
    /target ['"]FishjamChat['"] do/g,
    (match) =>
      `${match}\n ${INFO_GENERATED_COMMENT_IOS}\n pod 'FishjamCloudClient', :path => '../../../'`,
  );
  return podfileContent;
}

export const withCustomConfigIos: ConfigPlugin = (config) => {
  config = withPodfile(config, (configuration) => {
    let podfile = configuration.modResults.contents;

    podfile = replaceCloudClientForExtension(podfile);
    podfile = replaceCloudClientForMainApp(podfile);

    configuration.modResults.contents = podfile;
    return configuration;
  });

  return config;
};
