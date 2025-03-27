import { Button, Platform, StyleSheet, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import {
  useAudioSettings,
  AudioOutputDeviceType,
} from "@fishjam-cloud/react-native-client";

export function AudioDevicePicker() {
  const {
    selectedAudioOutputDevice,
    availableDevices,
    selectOutputAudioDevice,
    showAudioRoutePicker,
  } = useAudioSettings();

  if (Platform.OS === "ios") {
    return (
      <View style={styles.container}>
        <Button title="Select Audio Output" onPress={showAudioRoutePicker} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Picker
        selectedValue={selectedAudioOutputDevice?.type}
        onValueChange={(itemValue) => {
          if (itemValue) {
            selectOutputAudioDevice(itemValue as AudioOutputDeviceType);
          }
        }}
        style={styles.picker}
      >
        {availableDevices.map((device) => (
          <Picker.Item
            key={device.type}
            label={device.name}
            value={device.type}
          />
        ))}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: "100%",
    maxWidth: 300,
  },
  picker: {
    width: "100%",
    height: 80,
  },
});
