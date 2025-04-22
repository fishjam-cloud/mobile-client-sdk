import {
  ConfigPlugin,
  withGradleProperties,
  withProjectBuildGradle,
  withSettingsGradle,
} from "@expo/config-plugins";
import { INFO_GENERATED_COMMENT_ANDROID } from "./utils";

const withCustomSettingsGradle: ConfigPlugin = (config) =>
  withSettingsGradle(config, (configuration) => {
    configuration.modResults.contents += `
${INFO_GENERATED_COMMENT_ANDROID}
include ':fishjam-cloud-android-client'
project(':fishjam-cloud-android-client').projectDir = new File('../../../packages/android-client/FishjamClient/')

include ':android-client'
project(':android-client').projectDir = new File('../../../packages/react-native-whip-whep/packages/android-client/MobileWhepClient/')
`;

    return configuration;
  });

const withCustomProjectBuildGradle: ConfigPlugin = (config) =>
  withProjectBuildGradle(config, (configuration) => {
    const dokkaClasspath = `
${INFO_GENERATED_COMMENT_ANDROID}
classpath("org.jetbrains.dokka:dokka-gradle-plugin:1.8.10")
`;

    const classpathRegex = /dependencies\s*{[\s\S]*?}/;

    configuration.modResults.contents =
      configuration.modResults.contents.replace(classpathRegex, (match) => {
        if (!match.includes(dokkaClasspath)) {
          return match.replace(/}$/, `    ${dokkaClasspath}\n}`);
        }
        return match;
      });

    return configuration;
  });

const withCustomGradleProperties: ConfigPlugin = (config) =>
  withGradleProperties(config, (configuration) => {
    configuration.modResults.push({
      type: "property",
      key: "org.gradle.caching",
      value: "true",
    });
    configuration.modResults.push({
      type: "property",
      key: "org.gradle.parallel",
      value: "true",
    });
    configuration.modResults.push({
      type: "property",
      key: "org.gradle.jvmargs",
      value: "-Xmx4g",
    });
    return configuration;
  });

export const withCustomConfigAndroid: ConfigPlugin = (config) => {
  config = withCustomSettingsGradle(config);
  config = withCustomProjectBuildGradle(config);
  config = withCustomGradleProperties(config);

  return config;
};
