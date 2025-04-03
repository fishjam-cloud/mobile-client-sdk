import { NativeModule, requireNativeModule } from 'expo';

import { WebrtcSourceModuleEvents } from './WebrtcSource.types';

declare class WebrtcSourceModule extends NativeModule<WebrtcSourceModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<WebrtcSourceModule>('WebrtcSource');
