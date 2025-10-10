import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

import AppNavigator from './navigators/AppNavigator';
import { useReconnectionToasts } from './hooks/useReconnectionToasts';
import {
  setOverwriteDebugConfig,
  useCallKit,
} from '@fishjam-cloud/react-native-client';

setOverwriteDebugConfig({ validateEventPayloads: true });

function App(): React.JSX.Element {
  useReconnectionToasts();
  const { enableCallKit, isCallKitAvailable } = useCallKit();

  // Enable CallKit on iOS for better background call handling
  useEffect(() => {
    if (isCallKitAvailable) {
      enableCallKit({ localizedCallerName: 'Fishjam Chat' });
    }
  }, [enableCallKit, isCallKitAvailable]);

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
