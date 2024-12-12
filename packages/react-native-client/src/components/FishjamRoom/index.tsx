import { useEffect } from 'react';
import { joinRoom, leaveRoom } from '../../common/client';
import { useCamera } from '../../hooks/useCamera';
import { VideosGrid } from './VideosGrid';
import { SafeAreaView } from 'react-native';

export type FishjamRoomProps = {
  /**
   * URL to your fishjam instance
   */
  fishjamUrl: string;
  /**
   * Peer Token
   */
  peerToken: string;
};

/**
 * Simple component that enables your camera and show all tracks
 *
 * Usage:
 * ```tsx
 * <FishjamRoom
 *    fishjamUrl={FISHJAM_URL}
 *    peerToken={PEER_TOKEN}
 * />
 * ```
 * @category Components
 * @param {object} __namedParameters Component properties
 */
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
