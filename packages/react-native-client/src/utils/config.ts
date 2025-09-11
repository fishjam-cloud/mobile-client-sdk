export type DebugConfig = {
  validateEventPayloads: boolean;
};

const debugConfig: DebugConfig = {
  validateEventPayloads: false,
};

export function setDebugConfig(partial: Partial<DebugConfig>): void {
  Object.assign(debugConfig, partial);
}

export function getDebugConfig(): DebugConfig {
  return debugConfig;
}


