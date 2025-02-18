import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { FishjamRoom } from './FishjamRoom';

export type FishjamSandboxRoomProps = {
  /**
   * URL to your Sandbox Room Manager available at https://fishjam.io/app/sandbox
   */
  roomManagerUrl: string;
  /**
   * Room Name
   */
  roomName: string;
  /**
   * Peer Name
   */
  peerName: string;
  /**
   * Style
   */
  style?: StyleProp<ViewStyle>;
};

type RoomData = {
  url: string;
  peerToken: string;
};

/**
 * Simple UI to connect to Sandbox Room Manager
 */
export const FishjamSandboxRoom = ({
  roomManagerUrl,
  roomName,
  peerName,
  style,
}: FishjamSandboxRoomProps) => {
  const [roomData, setRoomData] = useState<RoomData | null>(null);

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const { fishjamUrl, token } = await joinRoomWithRoomManager(
          roomManagerUrl,
          roomName,
          peerName,
        );
        setRoomData({
          url: fishjamUrl,
          peerToken: token,
        });
      } catch (_) {
        setRoomData(null);
      }
    };
    fetchRoomData();
  }, [roomManagerUrl, roomName, peerName]);

  if (!roomData) {
    return <ActivityIndicator size="large" style={style ?? styles.indicator} />;
  }

  return (
    <FishjamRoom
      fishjamUrl={roomData.url}
      peerToken={roomData.peerToken}
      style={style}
    />
  );
};

const styles = StyleSheet.create({
  indicator: {
    flex: 1,
  },
});

async function joinRoomWithRoomManager(
  roomManagerUrl: string,
  roomName: string,
  peerName: string,
) {
  const url = new URL(roomManagerUrl);
  url.searchParams.set('roomName', roomName);
  url.searchParams.set('peerName', peerName);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const responseText = await response.text();
    console.warn(
      'get_fishjam_failed',
      `statusCode=${response.status}`,
      `message=${responseText}`,
    );
    throw new Error(responseText);
  }
  const tokenData = (await response.json()) as {
    url: string;
    peerToken: string;
  };

  return {
    fishjamUrl: tokenData.url,
    token: tokenData.peerToken,
  };
}
