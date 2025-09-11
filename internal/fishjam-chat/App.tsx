import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

import AppNavigator from './navigators/AppNavigator';
import { useReconnectionToasts } from './hooks/useReconnectionToasts';
import { setDebugConfig } from '@fishjam-cloud/react-native-client';

function App(): React.JSX.Element {
  setDebugConfig({ validateEventPayloads: true });
  useReconnectionToasts();

  return (
    <>
      <GestureHandlerRootView>
        <AppNavigator />
      </GestureHandlerRootView>
      <Toast />
    </>
  );
}

export default App;
