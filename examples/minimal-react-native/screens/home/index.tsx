import { TextInput, StyleSheet, Button } from 'react-native';
import { RootScreenProps } from '../../navigation/RootNavigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useConnectFishjam } from '../../hooks/useConnectFishjam';

export type HomeScreenProps = RootScreenProps<'Home'>;

const HomeScreen = () => {
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');
  const { connect, isLoading } = useConnectFishjam();

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        placeholder="Room Name"
        style={styles.input}
        value={roomName}
        onChangeText={setRoomName}
      />
      <TextInput
        placeholder="User Name"
        style={styles.input}
        value={userName}
        onChangeText={setUserName}
      />
      <Button
        title="Connect"
        onPress={() => {
          connect(roomName, userName);
        }}
        disabled={isLoading}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 16,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  button: {
    width: '100%',
    height: 40,
    borderRadius: 8,
    backgroundColor: 'blue',
  },
});

export default HomeScreen;
