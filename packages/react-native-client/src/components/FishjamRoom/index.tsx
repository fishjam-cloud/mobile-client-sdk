import { useEffect } from 'react';
import { joinRoom, leaveRoom } from '../../common/client';
import { useCamera } from '../../hooks/useCamera';
import { VideosGrid } from './VideosGrid';

export type FishjamRoomProps = {
  fishjamUrl: string;
  peerToken: string;
};

export const FishjamRoom = ({ fishjamUrl, peerToken }: FishjamRoomProps) => {
  const { isCameraOn, prepareCamera } = useCamera();

  console.log({ isCameraOn });

  useEffect(() => {
    const join = async () => {
      await prepareCamera({
        simulcastEnabled: false,
        quality: 'HD169',
        cameraEnabled: true,
      });
      console.log('camera ready');
      await joinRoom(fishjamUrl, peerToken, {
        peer: {},
        server: {},
      });
      console.log('result');
    };
    join();
    return () => {
      leaveRoom();
    };
  }, [fishjamUrl, peerToken, prepareCamera]);

  return <VideosGrid />;
};
