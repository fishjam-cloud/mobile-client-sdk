import { StyleSheet, View } from 'react-native';
import { JoinRoomForm } from './components/JoinRoomForm';
import { useConnection } from '@fishjam-cloud/react-native-client';
import { RoomInfo } from './components/RoomInfo';

export default function App() {
  const { peerStatus } = useConnection();

  return (
    <View style={styles.container}>
      {peerStatus === 'idle' ? <JoinRoomForm /> : <RoomInfo />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
});
