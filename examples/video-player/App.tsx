import { SafeAreaProvider } from 'react-native-safe-area-context';
import VideoPlayerScreen from './screens/VideoPlayerScreen';

const App = () => (
  <SafeAreaProvider>
    <VideoPlayerScreen />
  </SafeAreaProvider>
);

export default App;
