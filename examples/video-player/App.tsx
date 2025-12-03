import { StyleSheet, TextInput, View, Button } from 'react-native';
import FishjamPlayerViewer from './components/FishjamPlayerViewer';
import FishjamPlayerStreamer from './components/FishjamPlayerStreamer';
import { useState } from 'react';

const App = () => {
  const [roomName, setRoomName] = useState('test-room');
  const [selection, setSelection] = useState<'streamer' | 'viewer' | 'none'>(
    'none',
  );

  return (
    <View style={styles.container}>
      {selection === 'none' && (
        <>
          <TextInput
            style={styles.textInput}
            placeholder="Room Name"
            value={roomName}
            onChangeText={setRoomName}
          />
          <Button title="Stream" onPress={() => setSelection('streamer')} />
          <Button title="View stream" onPress={() => setSelection('viewer')} />
        </>
      )}
      {selection === 'streamer' && (
        <>
          <FishjamPlayerStreamer roomName={roomName} />
          <Button title="Back" onPress={() => setSelection('none')} />
        </>
      )}
      {selection === 'viewer' && (
        <>
          <FishjamPlayerViewer roomName={roomName} />
          <Button title="Back" onPress={() => setSelection('none')} />
        </>
      )}
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'black',
  },
  textInput: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 8,
    padding: 8,
    color: 'white',
    backgroundColor: 'black',
    marginBottom: 16,
  },
});
