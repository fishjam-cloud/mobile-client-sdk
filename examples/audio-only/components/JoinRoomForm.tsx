import { useConnection } from "@fishjam-cloud/react-native-client";
import { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  View,
  KeyboardAvoidingView,
  SafeAreaView,
} from "react-native";
import { AudioDevicePicker } from "./AudioDevicePicker";
import DismissKeyboard from "./DismissKeyboard";

const ROOM_MANAGER_URL = "";

type RoomManagerResponse = {
  peerToken: string;
  url: string;
};

export type RoomManagerParams = {
  roomName: string;
  peerName: string;
};

export const JoinRoomForm = () => {
  const [roomName, setRoomName] = useState("");
  const [peerName, setPeerName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { joinRoom } = useConnection();

  const handleSubmit = async () => {
    try {
      if (!roomName || !peerName) {
        return;
      }

      setIsLoading(true);

      const url = new URL(ROOM_MANAGER_URL);
      url.searchParams.set("roomName", roomName);
      url.searchParams.set("peerName", peerName);

      const response = await fetch(url.toString());

      const responseData: RoomManagerResponse = await response.json();
      await joinRoom({
        url: responseData.url,
        peerToken: responseData.peerToken,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DismissKeyboard>
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>Audio only chat example</Text>

        <KeyboardAvoidingView behavior="height" style={styles.container}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Room name</Text>
            <TextInput
              style={styles.input}
              placeholder="Room name"
              placeholderTextColor="#666"
              value={roomName}
              onChangeText={setRoomName}
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect={false}
              autoFocus={true}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#666"
              value={peerName}
              onChangeText={setPeerName}
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect={false}
            />
          </View>
        </KeyboardAvoidingView>
        <AudioDevicePicker />
        <TouchableOpacity
          style={styles.button}
          disabled={isLoading}
          onPress={handleSubmit}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Joining..." : "Join room"}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </DismissKeyboard>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    padding: 20,
  },
  safeArea: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
  },
  inputContainer: {
    gap: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    height: 48,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 24,
  },
});
