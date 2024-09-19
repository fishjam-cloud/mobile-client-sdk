export type FishjamPluginOptions =
  | {
      android?: {
        enableForegroundService?: boolean;
      };
      ios?: {
        iphoneDeploymentTarget?: string;
        enableScreensharing?: boolean;
      };
    }
  | undefined;
