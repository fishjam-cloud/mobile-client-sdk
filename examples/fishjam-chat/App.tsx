import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

import AppNavigator from './navigators/AppNavigator';
import { useReconnectionToasts } from './hooks/useReconnectionToasts';

function App(): React.JSX.Element {
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
