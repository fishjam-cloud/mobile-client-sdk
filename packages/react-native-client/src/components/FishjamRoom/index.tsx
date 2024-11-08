import { useEffect } from 'react';
import { joinRoom, leaveRoom } from '../../common/client';
import { useCamera } from '../../hooks/useCamera';
import { VideosGrid } from './VideosGrid';
import { SafeAreaView } from 'react-native';

export type FishjamRoomProps = {
  fishjamUrl: string;
  peerToken: string;
};

export const FishjamRoom = ({ fishjamUrl, peerToken }: FishjamRoomProps) => {
  const { prepareCamera } = useCamera();

  useEffect(() => {
    const join = async () => {
      await prepareCamera({
        simulcastEnabled: false,
        quality: 'HD169',
        cameraEnabled: true,
      });
      await joinRoom(fishjamUrl, peerToken, {
        peer: {},
        server: {},
      });
    };
    join();
    return () => {
      leaveRoom();
    };
  }, [fishjamUrl, peerToken, prepareCamera]);

  return (
    <SafeAreaView>
      <VideosGrid />
    </SafeAreaView>
  );
};
