import { ConfigPlugin, withDangerousMod } from '@expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

const podName = 'FishjamCloudClient';

const withCustomPodfile: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        'Podfile',
      );
      let podfileContent = fs.readFileSync(podfilePath, 'utf-8');

      if (!podfileContent.includes(`pod '${podName}'`)) {
        podfileContent = podfileContent.replace(
          /target ['"][^'"]+['"] do/g,
          (match) => `${match}\n  pod '${podName}', :path => '../../../'`,
        );

        fs.writeFileSync(podfilePath, podfileContent);
      }

      return config;
    },
  ]);
};

export default withCustomPodfile;
