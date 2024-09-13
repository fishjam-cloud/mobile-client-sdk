const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withCustomPodfile = (config) => {
    return withDangerousMod(config, [
        'ios',
        (config) => {
            const podfilePath = path.join(
                config.modRequest.platformProjectRoot,
                'Podfile',
            );
            let podfileContent = fs.readFileSync(podfilePath, 'utf-8');

            // Check if the Pod is already added (to prevent duplicates)
            if (!podfileContent.includes("pod 'FishjamCloudClient'")) {
                // Add the pod at the end of the target section
                podfileContent = podfileContent.replace(
                    /target ['"][^'"]+['"] do/g,
                    (match) => `${match}\n  pod 'FishjamCloudClient', :path => '../../../'`,
                );

                fs.writeFileSync(podfilePath, podfileContent);
            }

            return config;
        },
    ]);
};

module.exports = withCustomPodfile;
