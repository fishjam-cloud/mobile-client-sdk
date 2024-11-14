import { ConfigPlugin, withPodfile, withXcodeProject } from '@expo/config-plugins';
import * as fs from 'promise-fs';
import { INFO_GENERATED_COMMENT_IOS } from './utils';

const APP_TARGET_NAME = 'FishjamChat';

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

  podfileContent = podfileContent.replace(targetRegex, (match) => {
    return match.replace(podToReplace, replacementPod);
  });
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

/**
 * Sets development team for EAS build.
 * EAS build will fail if the development team is not set properly in xcode project
 */
const withFishjamChatSigning: ConfigPlugin = (config) => {
  return withXcodeProject(config, async (props) => {
    const appName = props.modRequest.projectName || '';
    const iosPath = props.modRequest.platformProjectRoot;
    const xcodeProject = props.modResults;

    const projPath = `${iosPath}/${appName}.xcodeproj/project.pbxproj`;

    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      if (
        typeof configurations[key].buildSettings !== 'undefined' &&
        configurations[key].buildSettings.PRODUCT_NAME === `"${APP_TARGET_NAME}"`
      ) {
        const buildSettingsObj = configurations[key].buildSettings;
        buildSettingsObj.CODE_SIGN_STYLE = 'Automatic';
        buildSettingsObj.DEVELOPMENT_TEAM = 'J5FM626PE2';
      }
    }

    await fs.writeFile(projPath, xcodeProject.writeSync());

    return props;
  });
};

export const withCustomConfigIos: ConfigPlugin = (config) => {
  withFishjamChatSigning(config);
  
  config = withPodfile(config, (configuration) => {
    let podfile = configuration.modResults.contents;

    podfile = replaceCloudClientForExtension(podfile);
    podfile = replaceCloudClientForMainApp(podfile);

    configuration.modResults.contents = podfile;
    return configuration;
  });

  return config;
};
