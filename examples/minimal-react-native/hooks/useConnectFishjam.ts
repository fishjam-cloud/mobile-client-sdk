import { useEffect, useState } from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useCamera, useConnection } from '@fishjam-cloud/react-native-client';
import { RootStackParamList } from '../navigation/RootNavigation';

export const useConnectFishjam = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const { joinRoom, leaveRoom } = useConnection();
  const { prepareCamera } = useCamera();

  const [isLoading, setIsLoading] = useState(false);

  const joinRoomWithRoomManager = async (
    roomManagerUrl: string,
    roomName: string,
    peerName: string,
  ) => {
    const url = new URL(roomManagerUrl);
    url.searchParams.set('roomName', roomName);
    url.searchParams.set('peerName', peerName);

    const response = await fetch(url.toString());

    const tokenData = (await response.json()) as {
      url: string;
      peerToken: string;
    };
    return {
      fishjamUrl: tokenData.url,
      token: tokenData.peerToken,
    };
  };

  const connect = async (roomName: string, userName: string) => {
    try {
      setIsLoading(true);
      const roomManagerUrl = process.env.EXPO_PUBLIC_ROOM_MANAGER;

      leaveRoom();

      const { fishjamUrl, token } = await joinRoomWithRoomManager(
        roomManagerUrl,
        roomName,
        userName,
      );

      await prepareCamera({
        simulcastEnabled: true,
        quality: 'HD169',
        cameraEnabled: true,
      });

      await joinRoom({
        peerToken: token,
        url: fishjamUrl,
        peerMetadata: {
          displayName: userName,
        },
      });

      navigation.navigate('Room', {
        userName,
      });
    } catch (e) {
      console.error('Error connecting to Fishjam', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      leaveRoom();
    };
  }, [leaveRoom]);

  return {
    connect,
    isLoading,
  };
};
