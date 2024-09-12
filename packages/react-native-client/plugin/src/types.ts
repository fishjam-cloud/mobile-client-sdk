export type FishjamPluginOptions = {
  android: {
    enableForegroundService: boolean;
  };
  ios: {
    iPhoneDeploymentTarget?: string;
    setUpScreensharing: boolean;
  };
};
