import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigators/RootNavigator';

const App = () => (
  <SafeAreaProvider>
    <AppNavigator />
  </SafeAreaProvider>
);

export default App;
