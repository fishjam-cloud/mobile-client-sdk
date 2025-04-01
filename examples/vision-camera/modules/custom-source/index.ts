// Reexport the native module. On web, it will be resolved to CustomSourceModule.web.ts
// and on native platforms to CustomSourceModule.ts
export { default } from './src/CustomSourceModule';
export { default as CustomSourceView } from './src/CustomSourceView';
export * from  './src/CustomSource.types';
