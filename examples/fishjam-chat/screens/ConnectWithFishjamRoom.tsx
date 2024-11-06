import { FishjamRoom } from '@fishjam-cloud/react-native-client';
import { useEffect, useState } from 'react';

type RoomData = {
  url: string;
  peerToken: string;
};

export const ConnectWithFishjamRoom = () => {
  const [roomData, setRoomData] = useState<RoomData | null>(null);

  useEffect(() => {
    const fetchRoomData = async () => {
      const response = await fetch('');

      if (response.ok) {
        const roomData = (await response.json()) as RoomData;
        setRoomData(roomData);
      }
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
