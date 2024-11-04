import { useEffect } from 'react';
import { joinRoom, leaveRoom } from '../../common/client';
import { useCamera } from '../../hooks/useCamera';
import { VideosGrid } from './VideosGrid';

export type FishjamRoomProps = {
  fishjamUrl: string;
  peerToken: string;
};

export const FishjamRoom = ({ fishjamUrl, peerToken }: FishjamRoomProps) => {
  const { prepareCamera } = useCamera();

  useEffect(() => {
    prepareCamera({
      simulcastEnabled: false,
      quality: 'HD169',
      cameraEnabled: true,
    });
  }, [prepareCamera]);

  useEffect(() => {
    const join = async () => {
      await joinRoom(fishjamUrl, peerToken, {
        peer: {},
        server: {},
      });
    };
    join();
    return () => {
      leaveRoom();
    };
  }, [fishjamUrl, peerToken]);

  return <VideosGrid />;
};
