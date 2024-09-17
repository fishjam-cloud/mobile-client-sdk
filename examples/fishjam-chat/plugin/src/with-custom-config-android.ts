import {
  ConfigPlugin,
  withProjectBuildGradle,
  withSettingsGradle,
} from '@expo/config-plugins';

const withCustomSettingsGradle: ConfigPlugin = (config) => {
  return withSettingsGradle(config, (config) => {
    config.modResults.contents += `
include ':fishjam-cloud-android-client'
project(':fishjam-cloud-android-client').projectDir = new File('../../../packages/android-client/FishjamClient/')
      `;

    return config;
  });
};

const withCustomProjectBuildGradle: ConfigPlugin = (config) => {
  return withProjectBuildGradle(config, (config) => {
    const dokkaClasspath = `classpath("org.jetbrains.dokka:dokka-gradle-plugin:1.8.10")`;

    const classpathRegex = /dependencies\s*{[\s\S]*?}/;

    config.modResults.contents = config.modResults.contents.replace(
      classpathRegex,
      (match) => {
        if (!match.includes(dokkaClasspath)) {
          return match.replace(/}$/, `    ${dokkaClasspath}\n}`);
        }
        return match;
      },
    );

    return config;
  });
};

export const withCustomConfigAndroid: ConfigPlugin = (config) => {
  config = withCustomSettingsGradle(config);
  config = withCustomProjectBuildGradle(config);

  return config;
};
