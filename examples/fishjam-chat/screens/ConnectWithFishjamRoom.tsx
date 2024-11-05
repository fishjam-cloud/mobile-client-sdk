import { FishjamRoom } from '@fishjam-cloud/react-native-client';
import { useEffect, useState } from 'react';

const ROOM_MANAGER_URL = 'https://room.fishjam.work/api/rooms';
const ROOM_NAME = 'mobile-test';
const PEER_NAME = 'radon-1';

type RoomData = {
  url: string;
  peerToken: string;
};

export const ConnectWithFishjamRoom = () => {
  const [roomData, setRoomData] = useState<RoomData | null>(null);

  useEffect(() => {
    const fetchRoomData = async () => {
      const url = new URL(ROOM_MANAGER_URL);
      url.searchParams.set('roomName', ROOM_NAME);
      url.searchParams.set('peerName', PEER_NAME);

      const response = await fetch(url.toString());

      if (!response.ok) {
        const responseText = await response.text();
        console.error(
          'get_fishjam_failed',
          `statusCode=${response.status}`,
          `message=${responseText}`,
        );
        return;
      }
      const roomData = (await response.json()) as RoomData;
      setRoomData(roomData);
    };
    fetchRoomData();
  }, []);

  if (!roomData) {
    return null;
  }

  return (
    <FishjamRoom fishjamUrl={roomData.url} peerToken={roomData.peerToken} />
  );
};
