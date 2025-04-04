import { useConnection } from "@fishjam-cloud/react-native-client";
import { useCallback } from "react";
import { Button, Text, View } from "react-native";
import { DEFAULT_PEER_NAME, DEFAULT_ROOM_NAME } from "../config/appConfig";
import { getRoomDetails } from "../utils/roomUtils";

export function JoinRoomButton() {
  const { joinRoom, leaveRoom, peerStatus } = useConnection();

  const onPressJoin = useCallback(async () => {
    const data = await getRoomDetails(DEFAULT_ROOM_NAME, DEFAULT_PEER_NAME);
    const { url, peerToken } = data;

    await joinRoom({ url, peerToken });
  }, [joinRoom]);

  return (
    <View style={{ flex: 1 }}>
      <Text>{peerStatus}</Text>
      {peerStatus === "idle" && (
        <Button onPress={onPressJoin} title="Join Room" />
      )}
      {peerStatus === "connected" && (
        <Button onPress={leaveRoom} color="red" title="Leave Room" />
      )}
    </View>
  );
}
