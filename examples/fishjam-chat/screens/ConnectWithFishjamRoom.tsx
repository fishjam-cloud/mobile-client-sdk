import { FishjamRoom } from '@fishjam-cloud/react-native-client';
import { useEffect, useState } from 'react';
import { joinRoomWithRoomManager } from '../utils/roomManager';
import { ActivityIndicator, StyleSheet } from 'react-native';

type RoomData = {
  url: string;
  peerToken: string;
};

export const ConnectWithFishjamRoom = () => {
  const [roomData, setRoomData] = useState<RoomData | null>(null);

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const { fishjamUrl, token } = await joinRoomWithRoomManager(
          'https://room.fishjam.work/api/rooms',
          'test-room',
          'test-user',
        );
        setRoomData({
          url: fishjamUrl,
          peerToken: token,
        });
      } catch {
        setRoomData(null);
      }
    };
    fetchRoomData();
  }, []);

  if (!roomData) {
    return <ActivityIndicator size="large" style={styles.indicator} />;
  }

  return (
    <FishjamRoom fishjamUrl={roomData.url} peerToken={roomData.peerToken} />
  );
};

const styles = StyleSheet.create({
  indicator: {
    flex: 1,
  },
});
