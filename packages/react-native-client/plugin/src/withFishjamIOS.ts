// ios-related code was mostly copied from OneSignal expo plugin: https://github.com/OneSignal/onesignal-expo-plugin/blob/main/onesignal/withOneSignalIos.ts
import {
  ConfigPlugin,
  withEntitlementsPlist,
  withXcodeProject,
  withInfoPlist,
  withPodfileProperties,
} from '@expo/config-plugins';
import fs from 'promise-fs';
import * as path from 'path';
import { FishjamPluginOptions } from './types';

const SBE_TARGET_NAME = 'FishjamScreenBroadcastExtension';
const SBE_PODFILE_SNIPPET = `
  target '${SBE_TARGET_NAME}' do
    pod 'MembraneRTC/Broadcast'
  end`;
const TARGETED_DEVICE_FAMILY = `"1,2"`;
const IPHONEOS_DEPLOYMENT_TARGET = '13.4';
const GROUP_IDENTIFIER_TEMPLATE_REGEX = /{{GROUP_IDENTIFIER}}/gm;
const BUNDLE_IDENTIFIER_TEMPLATE_REGEX = /{{BUNDLE_IDENTIFIER}}/gm;

const withAppGroupPermissions: ConfigPlugin = (config) => {
  const APP_GROUP_KEY = 'com.apple.security.application-groups';
  return withEntitlementsPlist(config, (newConfig) => {
    if (!Array.isArray(newConfig.modResults[APP_GROUP_KEY])) {
      newConfig.modResults[APP_GROUP_KEY] = [];
    }
    const modResultsArray = newConfig.modResults[APP_GROUP_KEY] as any[];
    const entitlement = `group.${newConfig?.ios?.bundleIdentifier || ''}`;
    if (modResultsArray.indexOf(entitlement) !== -1) {
      return newConfig;
    }
    modResultsArray.push(entitlement);

    return newConfig;
  });
};

const withInfoPlistConstants: ConfigPlugin = (config) => {
  return withInfoPlist(config, (config) => {
    const bundleIdentifier = config.ios?.bundleIdentifier || '';
    config.modResults['AppGroupName'] = `group.${bundleIdentifier}`;
    config.modResults['ScreencastExtensionBundleId'] =
      `${bundleIdentifier}.${SBE_TARGET_NAME}`;
    return config;
  });
};

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

const withFishjamSBE: ConfigPlugin<FishjamPluginOptions> = (
  config,
  options,
) => {
  return withXcodeProject(config, async (props) => {
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

      if (xcodeProject.pbxTargetByName(`"${SBE_TARGET_NAME}"`)) {
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
            options.ios.iPhoneDeploymentTarget ?? IPHONEOS_DEPLOYMENT_TARGET;
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
};

const withFishjamIOS: ConfigPlugin<FishjamPluginOptions> = (config, props) => {
  if (props.ios.setUpScreensharing) {
    withAppGroupPermissions(config);
    withInfoPlistConstants(config);
    withFishjamSBE(config, props);
  }
  withPodfileProperties(config, (config) => {
    config.modResults['ios.deploymentTarget'] =
      props.ios.iPhoneDeploymentTarget ?? IPHONEOS_DEPLOYMENT_TARGET;
    return config;
  });
  return config;
};

export default withFishjamIOS;
