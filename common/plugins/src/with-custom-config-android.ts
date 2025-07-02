import {
  ConfigPlugin,
  withGradleProperties,
  withProjectBuildGradle,
  withSettingsGradle,
} from '@expo/config-plugins';
import { INFO_GENERATED_COMMENT_ANDROID } from './utils';

const removeGeneratedBlockAndroid = (fileContent: string, marker: string) => {
  const regex = new RegExp(`\n?\s*${marker}[\s\S]*?(?=\n[^\s#\/]|$)`, 'g');
  return fileContent.replace(regex, '');
};

const withCustomSettingsGradle: ConfigPlugin = (config) =>
  withSettingsGradle(config, (configuration) => {
    configuration.modResults.contents = removeGeneratedBlockAndroid(
      configuration.modResults.contents,
      INFO_GENERATED_COMMENT_ANDROID.trim()
    );
    configuration.modResults.contents += `
${INFO_GENERATED_COMMENT_ANDROID}
include ':fishjam-cloud-android-client'
project(':fishjam-cloud-android-client').projectDir = new File('../../../packages/android-client/FishjamClient/')
      `;

    return configuration;
  });

const withCustomProjectBuildGradle: ConfigPlugin = (config) =>
  withProjectBuildGradle(config, (configuration) => {
    const dokkaClasspath = `
${INFO_GENERATED_COMMENT_ANDROID}
classpath("org.jetbrains.dokka:dokka-gradle-plugin:1.8.10")
`;

    configuration.modResults.contents = removeGeneratedBlockAndroid(
      configuration.modResults.contents,
      INFO_GENERATED_COMMENT_ANDROID.trim()
    );

    const classpathRegex = /dependencies\s*{[\s\S]*?}/;

    configuration.modResults.contents =
      configuration.modResults.contents.replace(classpathRegex, (match) => {
        if (!match.includes(INFO_GENERATED_COMMENT_ANDROID.trim())) {
          return match.replace(/}$/, `    ${dokkaClasspath}\n}`);
        }
        return match;
      });

    return configuration;
  });

const withCustomGradleProperties: ConfigPlugin = (config) =>
  withGradleProperties(config, (configuration) => {
    configuration.modResults.push({
      type: 'property',
      key: 'org.gradle.caching',
      value: 'true',
    });
    configuration.modResults.push({
      type: 'property',
      key: 'org.gradle.parallel',
      value: 'true',
    });
    configuration.modResults.push({
      type: 'property',
      key: 'org.gradle.jvmargs',
      value: '-Xmx4g',
    });
    return configuration;
  });

export const withCustomConfigAndroid: ConfigPlugin = (config) => {
  config = withCustomSettingsGradle(config);
  config = withCustomProjectBuildGradle(config);
  config = withCustomGradleProperties(config);

  return config;
};
