import RNFishjamClientModule from '../RNFishjamClientModule';
import { ForegroundServiceOptions } from '../types';

export const startForegroundService = (options: ForegroundServiceOptions) => {
  RNFishjamClientModule.startForegroundService(options);
};

export const stopForegroundService = () => {
  RNFishjamClientModule.stopForegroundService();
};
