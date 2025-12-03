import { ConfigPlugin, withPodfile } from '@expo/config-plugins';
import { INFO_GENERATED_COMMENT_IOS } from './utils';

const removeGeneratedBlockIos = (podfileContent: string, marker: string) => {
  const regex = new RegExp(`\n?\s*${marker}[\s\S]*?(?=\n[^\s#]|$)`, 'g');
  return podfileContent.replace(regex, '');
};

const replaceCloudClientForExtension = (
  podfileContent: string,
  extensionTargetName?: string,
) => {
  const extTargetName =
    extensionTargetName || 'FishjamScreenBroadcastExtension';
  const podToReplace = "pod 'FishjamCloudBroadcastClient'";
  const replacementPod = `
  ${INFO_GENERATED_COMMENT_IOS}
  pod 'FishjamCloudBroadcastClient', :path => '../../../'`;

  const targetRegex = new RegExp(
    `target '${extTargetName}' do[\\s\\S]*?${podToReplace}[\\s\\S]*?end`,
    'g',
  );

  podfileContent = podfileContent.replace(targetRegex, (match) =>
    match.replace(podToReplace, replacementPod),
  );
  return podfileContent;
};

const replaceCloudClientForMainApp = (
  targetName: string,
  podfileContent: string,
) => {
  podfileContent = podfileContent.replace(
    new RegExp(`target ['"]${targetName}['"] do`, 'g'),
    (match) =>
      `${match}\n ${INFO_GENERATED_COMMENT_IOS}\n pod 'FishjamCloudClient', :path => '../../../'`,
  );
  return podfileContent;
};

export const withCustomConfigIos: ConfigPlugin<{
  targetName: string;
  extensionTargetName?: string;
}> = (config, { targetName, extensionTargetName }) => {
  config = withPodfile(config, (configuration) => {
    let podfile = configuration.modResults.contents;

    podfile = removeGeneratedBlockIos(
      podfile,
      INFO_GENERATED_COMMENT_IOS.trim(),
    );

    podfile = replaceCloudClientForExtension(podfile, extensionTargetName);
    podfile = replaceCloudClientForMainApp(targetName, podfile);

    configuration.modResults.contents = podfile;
    return configuration;
  });

  return config;
};
