import nativeModule, { ReceivableEvents } from '../RNFishjamClientModule';

export const initializeWarningListener = () => {
  if (!__DEV__) {
    return;
  }
  try {
    nativeModule.addListener(ReceivableEvents.Warning, (event) => {
      console.warn(event[ReceivableEvents.Warning]);
    });
  } catch (error: unknown) {
    console.error(
      `Failed to start warning listener: ${error instanceof Error ? error.message : ''}`,
    );
  }
};
