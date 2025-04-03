import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './WebrtcSource.types';

type WebrtcSourceModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class WebrtcSourceModule extends NativeModule<WebrtcSourceModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(WebrtcSourceModule);
