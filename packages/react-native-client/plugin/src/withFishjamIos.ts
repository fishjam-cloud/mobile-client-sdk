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

function getSbeTargetName(props: FishjamPluginOptions) {
  return (
    props?.ios?.broadcastExtensionTargetName ||
    'FishjamScreenBroadcastExtension'
  );
}

export function getSbePodfileSnippet(props: FishjamPluginOptions) {
  const targetName = getSbeTargetName(props);
  return `\ntarget '${targetName}' do\n  pod 'FishjamCloudClient/Broadcast'\nend`;
}

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
  props: FishjamPluginOptions,
) {
  const targetName = getSbeTargetName(props);
  const filePath = `${iosPath}/${targetName}/${fileName}`;
  let file = await fs.readFile(filePath, { encoding: 'utf-8' });
  file = file.replace(regex, value);
  await fs.writeFile(filePath, file);
}

/**
 * Inserts a required target to Podfile.
 * This is needed to provide the dependency of FishjamCloudClient/Broadcast to the extension.
 */
async function updatePodfile(iosPath: string, props: FishjamPluginOptions) {
  const podfileSnippet = getSbePodfileSnippet(props);
  let matches;
  try {
    const podfile = await fs.readFile(`${iosPath}/Podfile`, {
      encoding: 'utf-8',
    });
    matches = podfile.match(podfileSnippet);
  } catch (e) {
    console.error('Error reading from Podfile: ', e);
  }

  if (matches) {
    console.log(
      `${getSbeTargetName(props)} target already added to Podfile. Skipping...`,
    );
    return;
  }
  try {
    fs.appendFile(`${iosPath}/Podfile`, podfileSnippet);
  } catch (e) {
    console.error('Error writing to Podfile: ', e);
  }
}

/**
 * Adds "App Group" permission
 * App Group allow your app and the FishjamScreenBroadcastExtension to communicate with each other.
 */
const withAppGroupPermissions: ConfigPlugin<FishjamPluginOptions> = (
  config,
  props,
) => {
  const APP_GROUP_KEY = 'com.apple.security.application-groups';
  const bundleIdentifier = config.ios?.bundleIdentifier || '';
  const groupIdentifier =
    props?.ios?.appGroupContainerId || `group.${bundleIdentifier}`;
  const mainTarget = props?.ios?.mainTargetName || '';

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

    const mainTargetName = mainTarget || props.modRequest.projectName;
    const entitlementsFilePath = `${mainTargetName}/${mainTargetName}.entitlements`;
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();

    Object.keys(configurations).forEach((key) => {
      const config = configurations[key];
      if (config.buildSettings?.PRODUCT_NAME?.includes(mainTargetName)) {
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
const withInfoPlistConstants: ConfigPlugin<FishjamPluginOptions> = (
  config,
  props,
) =>
  withInfoPlist(config, (configuration) => {
    const bundleIdentifier = configuration.ios?.bundleIdentifier || '';
    const groupIdentifier =
      props?.ios?.appGroupContainerId || `group.${bundleIdentifier}`;
    configuration.modResults['AppGroupName'] = groupIdentifier;
    configuration.modResults['ScreenShareExtensionBundleId'] =
      `${bundleIdentifier}.${getSbeTargetName(props)}`;
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
    const groupIdentifier =
      options?.ios?.appGroupContainerId || `group.${bundleIdentifier}`;
    const xcodeProject = props.modResults;
    const targetName = getSbeTargetName(options);

    const pluginDir = require.resolve(
      '@fishjam-cloud/react-native-client/package.json',
    );
    const extensionSourceDir = path.join(
      pluginDir,
      '../plugin/broadcastExtensionFiles/',
    );

    await updatePodfile(iosPath, options);

    const projPath = `${iosPath}/${appName}.xcodeproj/project.pbxproj`;
    const templateTargetName = 'FishjamScreenBroadcastExtension';

    const extFiles = [
      'FishjamBroadcastSampleHandler.swift',
      `${templateTargetName}.entitlements`,
      `Info.plist`,
    ];

    const destFiles = [
      'FishjamBroadcastSampleHandler.swift',
      `${targetName}.entitlements`,
      `Info.plist`,
    ];

    await xcodeProject.parse(async function (err: Error) {
      if (err) {
        console.error(`Error parsing iOS project: ${JSON.stringify(err)}`);
        return;
      }
      if (xcodeProject.pbxTargetByName(targetName)) {
        console.log(`${targetName} already exists in project. Skipping...`);
        return;
      }
      try {
        await fs.mkdir(`${iosPath}/${targetName}`, { recursive: true });
        for (let i = 0; i < extFiles.length; i++) {
          const srcFile = `${extensionSourceDir}${extFiles[i]}`;
          const destFile = `${iosPath}/${targetName}/${destFiles[i]}`;
          await fs.copyFile(srcFile, destFile);
        }
      } catch (e) {
        console.error('Error copying extension files: ', e);
      }

      await updateFileWithRegex(
        iosPath,
        `${targetName}.entitlements`,
        GROUP_IDENTIFIER_TEMPLATE_REGEX,
        groupIdentifier,
        options,
      );
      await updateFileWithRegex(
        iosPath,
        'FishjamBroadcastSampleHandler.swift',
        GROUP_IDENTIFIER_TEMPLATE_REGEX,
        groupIdentifier,
        options,
      );
      await updateFileWithRegex(
        iosPath,
        'FishjamBroadcastSampleHandler.swift',
        BUNDLE_IDENTIFIER_TEMPLATE_REGEX,
        bundleIdentifier || '',
        options,
      );

      // Create new PBXGroup for the extension
      const extGroup = xcodeProject.addPbxGroup(
        extFiles,
        targetName,
        targetName,
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
        targetName,
        'app_extension',
        targetName,
        `${bundleIdentifier}.${targetName}`,
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
          configurations[key].buildSettings.PRODUCT_NAME === `"${targetName}"`
        ) {
          const buildSettingsObj = configurations[key].buildSettings;
          buildSettingsObj.IPHONEOS_DEPLOYMENT_TARGET =
            options?.ios?.iphoneDeploymentTarget ?? IPHONEOS_DEPLOYMENT_TARGET;
          buildSettingsObj.TARGETED_DEVICE_FAMILY = TARGETED_DEVICE_FAMILY;
          buildSettingsObj.CODE_SIGN_ENTITLEMENTS = `${targetName}/${targetName}.entitlements`;
          buildSettingsObj.CODE_SIGN_STYLE = 'Automatic';
          buildSettingsObj.INFOPLIST_FILE = `${targetName}/Info.plist`;
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
    config = withAppGroupPermissions(config, props);
    config = withInfoPlistConstants(config, props);
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
