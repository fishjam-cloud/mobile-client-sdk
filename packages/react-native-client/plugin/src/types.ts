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
        appGroupName?: string;
        mainTarget?: string;
      };
    }
  | undefined;
