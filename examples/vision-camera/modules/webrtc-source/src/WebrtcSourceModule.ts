import { NativeModule, requireNativeModule } from 'expo';

import { WebrtcSourceModuleEvents } from './WebrtcSource.types';

declare class WebrtcSourceModule extends NativeModule<WebrtcSourceModuleEvents> {
  createVisionCameraTrack(): Promise<void>;
  removeVisionCameraTrack(): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<WebrtcSourceModule>('WebrtcSource');
