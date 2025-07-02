import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigation from './navigation/RootNavigation';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const App = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigation />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
