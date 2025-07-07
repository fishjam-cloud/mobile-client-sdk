// ios-related code was mostly copied from OneSignal expo plugin: https://github.com/OneSignal/onesignal-expo-plugin/blob/main/onesignal/withOneSignalIos.ts
import {
  ConfigPlugin,
  withEntitlementsPlist,
  withXcodeProject,
  withInfoPlist,
  withPodfileProperties,
} from '@expo/config-plugins';
import * as fs from 'promise-fs';
import * as path from 'path';
import { FishjamPluginOptions } from './types';

const SBE_TARGET_NAME = 'FishjamScreenBroadcastExtension';
export const SBE_PODFILE_SNIPPET = `
target '${SBE_TARGET_NAME}' do
  pod 'FishjamCloudClient/Broadcast'
end`;
const TARGETED_DEVICE_FAMILY = `"1,2"`;
const IPHONEOS_DEPLOYMENT_TARGET = '15.1';
const GROUP_IDENTIFIER_TEMPLATE_REGEX = /{{GROUP_IDENTIFIER}}/gm;
const BUNDLE_IDENTIFIER_TEMPLATE_REGEX = /{{BUNDLE_IDENTIFIER}}/gm;

/**
 * A helper function for updating a value in a file for given regex
 */
async function updateFileWithRegex(
  iosPath: string,
  fileName: string,
  regex: RegExp,
  value: string,
) {
  const filePath = `${iosPath}/${SBE_TARGET_NAME}/${fileName}`;
  let file = await fs.readFile(filePath, { encoding: 'utf-8' });
  file = file.replace(regex, value);
  await fs.writeFile(filePath, file);
}

/**
 * Inserts a required target to Podfile.
 * This is needed to provide the dependency of FishjamCloudClient/Broadcast to the extension.
 */
async function updatePodfile(iosPath: string) {
  let matches;
  try {
    const podfile = await fs.readFile(`${iosPath}/Podfile`, {
      encoding: 'utf-8',
    });
    matches = podfile.match(SBE_PODFILE_SNIPPET);
  } catch (e) {
    console.error('Error reading from Podfile: ', e);
  }

  if (matches) {
    console.log(
      `${SBE_TARGET_NAME} target already added to Podfile. Skipping...`,
    );
    return;
  }
  try {
    fs.appendFile(`${iosPath}/Podfile`, SBE_PODFILE_SNIPPET);
  } catch (e) {
    console.error('Error writing to Podfile: ', e);
  }
}

/**
 * Adds "App Group" permission
 * App Group allow your app and the FishjamScreenBroadcastExtension to communicate with each other.
 */
const withAppGroupPermissions: ConfigPlugin = (config) => {
  const APP_GROUP_KEY = 'com.apple.security.application-groups';
  const bundleIdentifier = config.ios?.bundleIdentifier || '';
  const groupIdentifier = `group.${bundleIdentifier}`;

  config.ios ??= {};
  config.ios.entitlements ??= {};
  config.ios.entitlements[APP_GROUP_KEY] ??= [];

  const entitlementsArray = config.ios.entitlements[APP_GROUP_KEY] as string[];
  if (!entitlementsArray.includes(groupIdentifier)) {
    entitlementsArray.push(groupIdentifier);
  }

  config = withEntitlementsPlist(config, (newConfig) => {
    const modResultsArray =
      (newConfig.modResults[APP_GROUP_KEY] as string[]) || [];
    if (!modResultsArray.includes(groupIdentifier)) {
      modResultsArray.push(groupIdentifier);
    }
    newConfig.modResults[APP_GROUP_KEY] = modResultsArray;
    return newConfig;
  });

  config = withXcodeProject(config, (props) => {
    const xcodeProject = props.modResults;
    const targets = xcodeProject.getFirstTarget();
    const project = xcodeProject.getFirstProject();

    if (!targets || !project) {
      return props;
    }

    const targetUuid = targets.uuid;
    const projectUuid = project.uuid;

    const projectObj =
      xcodeProject.hash.project.objects.PBXProject[projectUuid];
    projectObj.attributes ??= {};
    projectObj.attributes.TargetAttributes ??= {};
    projectObj.attributes.TargetAttributes[targetUuid] ??= {};
    projectObj.attributes.TargetAttributes[targetUuid].SystemCapabilities ??=
      {};

    projectObj.attributes.TargetAttributes[targetUuid].SystemCapabilities[
      'com.apple.ApplicationGroups.iOS'
    ] = {
      enabled: 1,
    };

    const entitlementsFilePath = `${props.modRequest.projectName}/${props.modRequest.projectName}.entitlements`;
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();

    Object.keys(configurations).forEach((key) => {
      const config = configurations[key];
      if (
        config.buildSettings?.PRODUCT_NAME?.includes(
          props.modRequest.projectName,
        )
      ) {
        if (!config.buildSettings.CODE_SIGN_ENTITLEMENTS) {
          config.buildSettings.CODE_SIGN_ENTITLEMENTS = entitlementsFilePath;
        }
      }
    });

    return props;
  });

  return config;
};

/**
 * Adds constants to Info.plist
 * In other to dynamically retreive extension's bundleId and group name we need to store it in Info.plist.
 */
const withInfoPlistConstants: ConfigPlugin = (config) =>
  withInfoPlist(config, (configuration) => {
    const bundleIdentifier = configuration.ios?.bundleIdentifier || '';
    configuration.modResults['AppGroupName'] = `group.${bundleIdentifier}`;
    configuration.modResults['ScreenShareExtensionBundleId'] =
      `${bundleIdentifier}.${SBE_TARGET_NAME}`;
    return configuration;
  });

/**
 * Updates and copies required extension files.
 * Our extension needs to be properly setup inside the Xcode project. In order to do that we need to copy the files and update the pbxproj.
 */
const withFishjamSBE: ConfigPlugin<FishjamPluginOptions> = (config, options) =>
  withXcodeProject(config, async (props) => {
    const appName = props.modRequest.projectName || '';
    const iosPath = props.modRequest.platformProjectRoot;
    const bundleIdentifier = props.ios?.bundleIdentifier;
    const xcodeProject = props.modResults;

    const pluginDir = require.resolve(
      '@fishjam-cloud/react-native-client/package.json',
    );
    const extensionSourceDir = path.join(
      pluginDir,
      '../plugin/broadcastExtensionFiles/',
    );

    await updatePodfile(iosPath);

    const projPath = `${iosPath}/${appName}.xcodeproj/project.pbxproj`;
    const extFiles = [
      'FishjamBroadcastSampleHandler.swift',
      `${SBE_TARGET_NAME}.entitlements`,
      `Info.plist`,
    ];

    await xcodeProject.parse(async function (err: Error) {
      if (err) {
        console.error(`Error parsing iOS project: ${JSON.stringify(err)}`);
        return;
      }

      if (xcodeProject.pbxTargetByName(SBE_TARGET_NAME)) {
        console.log(
          `${SBE_TARGET_NAME} already exists in project. Skipping...`,
        );
        return;
      }
      try {
        // copy extension files
        await fs.mkdir(`${iosPath}/${SBE_TARGET_NAME}`, { recursive: true });
        for (let i = 0; i < extFiles.length; i++) {
          const extFile = extFiles[i];
          const targetFile = `${iosPath}/${SBE_TARGET_NAME}/${extFile}`;
          await fs.copyFile(`${extensionSourceDir}${extFile}`, targetFile);
        }
      } catch (e) {
        console.error('Error copying extension files: ', e);
      }

      // update extension files
      await updateFileWithRegex(
        iosPath,
        `${SBE_TARGET_NAME}.entitlements`,
        GROUP_IDENTIFIER_TEMPLATE_REGEX,
        `group.${bundleIdentifier}`,
      );
      await updateFileWithRegex(
        iosPath,
        'FishjamBroadcastSampleHandler.swift',
        GROUP_IDENTIFIER_TEMPLATE_REGEX,
        `group.${bundleIdentifier}`,
      );
      await updateFileWithRegex(
        iosPath,
        'FishjamBroadcastSampleHandler.swift',
        BUNDLE_IDENTIFIER_TEMPLATE_REGEX,
        bundleIdentifier || '',
      );

      // Create new PBXGroup for the extension
      const extGroup = xcodeProject.addPbxGroup(
        extFiles,
        SBE_TARGET_NAME,
        SBE_TARGET_NAME,
      );

      // Add the new PBXGroup to the top level group. This makes the
      // files / folder appear in the file explorer in Xcode.
      const groups = xcodeProject.hash.project.objects['PBXGroup'];
      Object.keys(groups).forEach(function (key) {
        if (groups[key].name === undefined) {
          xcodeProject.addToPbxGroup(extGroup.uuid, key);
        }
      });

      // WORK AROUND for codeProject.addTarget BUG
      // Xcode projects don't contain these if there is only one target
      // An upstream fix should be made to the code referenced in this link:
      //   - https://github.com/apache/cordova-node-xcode/blob/8b98cabc5978359db88dc9ff2d4c015cba40f150/lib/pbxProject.js#L860
      const projObjects = xcodeProject.hash.project.objects;
      projObjects['PBXTargetDependency'] =
        projObjects['PBXTargetDependency'] || {};
      projObjects['PBXContainerItemProxy'] =
        projObjects['PBXTargetDependency'] || {};

      // Add the SBE target
      // This adds PBXTargetDependency and PBXContainerItemProxy for you
      const sbeTarget = xcodeProject.addTarget(
        SBE_TARGET_NAME,
        'app_extension',
        SBE_TARGET_NAME,
        `${bundleIdentifier}.${SBE_TARGET_NAME}`,
      );

      // Add build phases to the new target
      xcodeProject.addBuildPhase(
        ['FishjamBroadcastSampleHandler.swift'],
        'PBXSourcesBuildPhase',
        'Sources',
        sbeTarget.uuid,
      );
      xcodeProject.addBuildPhase(
        [],
        'PBXResourcesBuildPhase',
        'Resources',
        sbeTarget.uuid,
      );

      xcodeProject.addBuildPhase(
        [],
        'PBXFrameworksBuildPhase',
        'Frameworks',
        sbeTarget.uuid,
      );

      xcodeProject.addFramework('ReplayKit.framework', {
        target: sbeTarget.uuid,
      });

      // Edit the Deployment info of the new Target, only IphoneOS and Targeted Device Family
      // However, can be more
      const configurations = xcodeProject.pbxXCBuildConfigurationSection();
      for (const key in configurations) {
        if (
          typeof configurations[key].buildSettings !== 'undefined' &&
          configurations[key].buildSettings.PRODUCT_NAME ===
            `"${SBE_TARGET_NAME}"`
        ) {
          const buildSettingsObj = configurations[key].buildSettings;
          buildSettingsObj.IPHONEOS_DEPLOYMENT_TARGET =
            options?.ios?.iphoneDeploymentTarget ?? IPHONEOS_DEPLOYMENT_TARGET;
          buildSettingsObj.TARGETED_DEVICE_FAMILY = TARGETED_DEVICE_FAMILY;
          buildSettingsObj.CODE_SIGN_ENTITLEMENTS = `${SBE_TARGET_NAME}/${SBE_TARGET_NAME}.entitlements`;
          buildSettingsObj.CODE_SIGN_STYLE = 'Automatic';
          buildSettingsObj.INFOPLIST_FILE = `${SBE_TARGET_NAME}/Info.plist`;
          buildSettingsObj.SWIFT_VERSION = '5.0';
          buildSettingsObj.MARKETING_VERSION = '1.0.0';
          buildSettingsObj.CURRENT_PROJECT_VERSION = '1';
          buildSettingsObj.ENABLE_BITCODE = 'NO';
        }
      }

      await fs.writeFile(projPath, xcodeProject.writeSync());
    });

    return props;
  });

const withFishjamPictureInPicture: ConfigPlugin<FishjamPluginOptions> = (
  config,
  props,
) =>
  withInfoPlist(config, (configuration) => {
    if (props?.ios?.supportsPictureInPicture) {
      const backgroundModes = new Set(
        configuration.modResults.UIBackgroundModes ?? [],
      );
      backgroundModes.add('audio');
      configuration.modResults.UIBackgroundModes = Array.from(backgroundModes);
    }

    return configuration;
  });

/**
 * Applies screen sharing plugin if enabled. In order for screensharing to work, we need to copy extension files to your iOS project.
 * Allows for dynamically changing deploymentTarget.
 */
const withFishjamIos: ConfigPlugin<FishjamPluginOptions> = (config, props) => {
  if (props?.ios?.enableScreensharing) {
    config = withAppGroupPermissions(config);
    config = withInfoPlistConstants(config);
    config = withFishjamSBE(config, props);
  }
  config = withPodfileProperties(config, (configuration) => {
    configuration.modResults['ios.deploymentTarget'] =
      props?.ios?.iphoneDeploymentTarget ?? IPHONEOS_DEPLOYMENT_TARGET;
    return configuration;
  });
  config = withFishjamPictureInPicture(config, props);

  return config;
};

export default withFishjamIos;
