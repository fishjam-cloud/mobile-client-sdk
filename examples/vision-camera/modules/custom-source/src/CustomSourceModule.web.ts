import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './CustomSource.types';

type CustomSourceModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class CustomSourceModule extends NativeModule<CustomSourceModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(CustomSourceModule);
