import { useEffect } from 'react';
import { useCamera } from '../../hooks/useCamera';
import { useConnection } from '../../hooks/useConnection';
import { VideosGrid } from './VideosGrid';
import { SafeAreaView } from 'react-native';

export type FishjamRoomProps = {
  /**
   * ID of your fishjam instance
   */
  fishjamId: string;
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
 * const FISHJAM_ID = 'your-fishjam_id';
 * const PEER_TOKEN = 'your-peer-token';
 *
 * <FishjamRoom
 *    fishjamId={FISHJAM_ID}
 *    peerToken={PEER_TOKEN}
 * />
 * ```
 * @category Components
 * @param {object} props
 * @param {string} props.fishjamId
 * @param {string} props.peerToken
 */
export const FishjamRoom = ({ fishjamId, peerToken }: FishjamRoomProps) => {
  const { prepareCamera } = useCamera();
  const { leaveRoom, joinRoom } = useConnection();

  useEffect(() => {
    const join = async () => {
      try {
        await prepareCamera({
          simulcastEnabled: true,
          quality: 'HD169',
          cameraEnabled: true,
        });
        await joinRoom({ fishjamId, peerToken });
      } catch (e) {
        console.warn(e);
      }
    };
    join();
    return () => {
      leaveRoom();
    };
  }, [fishjamId, peerToken, prepareCamera]);

  return (
    <SafeAreaView>
      <VideosGrid />
    </SafeAreaView>
  );
};
