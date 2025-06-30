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
 * import { FishjamRoom } from '@fishjam-cloud/react-native-client';
 * import React from 'react';
 * 
 * const FISHJAM_URL = 'https://fishjam.io/your_fishjam';
 * const PEER_TOKEN = 'your-peer-token';
 * 
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
      try {
        await prepareCamera({
          simulcastEnabled: true,
          quality: 'HD169',
          cameraEnabled: true,
        });
        await joinRoom(fishjamUrl, peerToken, {
          peer: {},
          server: {},
        });
      } catch (e) {
        console.warn(e);
      }
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
