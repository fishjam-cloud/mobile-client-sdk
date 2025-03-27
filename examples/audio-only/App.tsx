import { StyleSheet, Text, View } from "react-native";
import { AudioDevicePicker } from "./components/AudioDevicePicker";

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Audio Device Selection</Text>
      <AudioDevicePicker />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
