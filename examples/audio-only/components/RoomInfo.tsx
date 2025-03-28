import {
  PeerStatus,
  useConnection,
  useMicrophone,
} from "@fishjam-cloud/react-native-client";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useEffect } from "react";
export const RoomInfo = () => {
  const { leaveRoom, peerStatus } = useConnection();
  const { isMicrophoneOn, toggleMicrophone } = useMicrophone();

  const onDisconnect = () => {
    leaveRoom();
  };

  useEffect(
    () => () => {
      leaveRoom();
    },
    [leaveRoom],
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.microphoneButton}
        onPress={toggleMicrophone}
      >
        <Text style={styles.microphoneButtonText}>
          {isMicrophoneOn ? "Disable Microphone" : "Enable Microphone"}
        </Text>
      </TouchableOpacity>
      <Text style={styles.text}>{peerStatusToLabel[peerStatus]}</Text>
      <View style={styles.microphoneContainer}></View>
      {peerStatus === "connected" && (
        <TouchableOpacity
          style={styles.disconnectButton}
          onPress={onDisconnect}
        >
          <Text style={styles.disconnectButtonText}>Disconnect</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const peerStatusToLabel: Record<PeerStatus, string> = {
  connecting: "Connecting",
  connected: "Connected",
  error: "Failed to join the room",
  idle: "Idle",
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: "center",
    gap: 12,
  },
  text: {
    fontSize: 16,
    textAlign: "center",
  },
  disconnectButton: {
    backgroundColor: "#FF3B30",
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  disconnectButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  microphoneContainer: {
    flexDirection: "row",
    gap: 12,
  },
  microphoneButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  microphoneButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
