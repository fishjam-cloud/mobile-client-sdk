// Reexport the native module. On web, it will be resolved to WebrtcSourceModule.web.ts
// and on native platforms to WebrtcSourceModule.ts
export { default } from './src/WebrtcSourceModule';
export { default as WebrtcSourceView } from './src/WebrtcSourceView';
export * from './src/WebrtcSource.types';
