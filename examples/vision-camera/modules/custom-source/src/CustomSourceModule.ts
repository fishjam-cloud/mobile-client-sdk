import { NativeModule, requireNativeModule } from "expo";

import { CustomSourceModuleEvents } from "./CustomSource.types";

declare class CustomSourceModule extends NativeModule<CustomSourceModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<CustomSourceModule>("CustomSource");
