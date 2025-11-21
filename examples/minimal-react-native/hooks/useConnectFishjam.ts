import { useEffect, useState } from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import {
  useCamera,
  useConnection,
  useSandbox,
} from '@fishjam-cloud/react-native-client';
import { RootStackParamList } from '../navigation/RootNavigation';

export const useConnectFishjam = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const { leaveRoom, joinRoom } = useConnection();
  const { getSandboxPeerToken } = useSandbox({
    fishjamId: process.env.EXPO_PUBLIC_FISHJAM_ID,
  });
  const { prepareCamera } = useCamera();

  const [isLoading, setIsLoading] = useState(false);

  const connect = async (roomName: string, userName: string) => {
    try {
      setIsLoading(true);

      leaveRoom();
      const peerToken = await getSandboxPeerToken(roomName, userName);

      await prepareCamera({
        quality: 'HD169',
        cameraEnabled: true,
      });

      await joinRoom({
        fishjamId: process.env.EXPO_PUBLIC_FISHJAM_ID,
        peerToken,
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
