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
 * Example usage:
 * ```tsx
 * <FishjamRoom
 *    fishjamUrl={FISHJAM_URL}
 *    peerToken={PEER_TOKEN}
 * />
 * ```
 * @category Components
 * @param {object} props
 * @param {string} props.fishjamUrl
 * @param {string} props.peerToken
 */
export const FishjamRoom = ({ fishjamUrl, peerToken }: FishjamRoomProps) => {
  const { prepareCamera } = useCamera();

  useEffect(() => {
    const join = async () => {
      await prepareCamera({
        simulcastEnabled: true,
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
