export type FishjamPluginOptions =
  | {
      android?: {
        enableForegroundService?: boolean;
        supportsPictureInPicture?: boolean;
      };
      ios?: {
        iphoneDeploymentTarget?: string;
        enableScreensharing?: boolean;
        supportsPictureInPicture?: boolean;
        appGroupContainerId?: string;
        mainTargetName?: string;
        broadcastExtensionTargetName?: string;
      };
    }
  | undefined;
