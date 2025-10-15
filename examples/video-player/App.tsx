import { StyleSheet, View } from 'react-native';
import FishjamPlayer from './components/FishjamPlayer';

const roomName = 'test';

const App = () => {
  return (
    <View style={styles.videoContainer}>
      <FishjamPlayer roomName={roomName} />
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  videoContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'black',
  },
});
