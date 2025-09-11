export type DebugConfig = {
  validateEventPayloads: boolean;
};

const debugConfig: DebugConfig = {
  validateEventPayloads: process.env.EXPO_PUBLIC_CHECK_EVENT_PAYLOAD ?? false,
};

export function setOverwriteDebugConfig(partial: Partial<DebugConfig>): void {
  Object.assign(debugConfig, partial);
}

export function getDebugConfig(): DebugConfig {
  return debugConfig;
}


