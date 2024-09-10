import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

import { useReconnection } from "@fishjam-cloud/react-native-client";

export default function App() {
  const { reconnectionStatus } = useReconnection();

  return (
    <View style={styles.container}>
      <Text>
        Open up App.tsx to start working on your app {reconnectionStatus}!
      </Text>
      <StatusBar style="auto" />
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
