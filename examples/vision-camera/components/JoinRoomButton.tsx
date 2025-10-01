import { useConnection, useSandbox } from '@fishjam-cloud/react-native-client';
import { useCallback } from 'react';
import { Button, Text, View } from 'react-native';
import { DEFAULT_PEER_NAME, DEFAULT_ROOM_NAME } from '../config/appConfig';

export function JoinRoomButton() {
  const { joinRoom, leaveRoom, peerStatus } = useConnection();
  const { getSandboxPeerToken } = useSandbox({
      fishjamId: process.env.EXPO_PUBLIC_FISHJAM_ID,
    });

  const onPressJoin = useCallback(async () => {
    try {
      const peerToken = await getSandboxPeerToken(DEFAULT_ROOM_NAME, DEFAULT_PEER_NAME);

      await joinRoom({
        fishjamId: process.env.EXPO_PUBLIC_FISHJAM_ID,
        peerToken
      });
    } catch (error) {
      console.error(error);
    }
  }, [joinRoom]);

  return (
    <View style={{ flex: 1 }}>
      <Text>{peerStatus}</Text>
      {(peerStatus === 'idle' || peerStatus === 'error') && (
        <Button onPress={onPressJoin} title="Join Room" />
      )}
      {peerStatus === 'connected' && (
        <Button onPress={leaveRoom} color="red" title="Leave Room" />
      )}
    </View>
  );
}
