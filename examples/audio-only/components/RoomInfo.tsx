import { PeerStatus, useConnection } from "@fishjam-cloud/react-native-client";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useEffect } from "react";
export const RoomInfo = () => {
  const { leaveRoom, peerStatus } = useConnection();

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
      <Text style={styles.text}>{peerStatusToLabel[peerStatus]}</Text>
      {peerStatus === "connected" && (
        <TouchableOpacity style={styles.button} onPress={onDisconnect}>
          <Text style={styles.buttonText}>Disconnect</Text>
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
  button: {
    backgroundColor: "#FF3B30",
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
