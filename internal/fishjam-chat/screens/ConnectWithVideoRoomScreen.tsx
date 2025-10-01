import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button, TextInput, DismissKeyboard } from '../components';
import {
  AppRootStackParamList,
  TabParamList,
} from '../navigators/AppNavigator';
import { joinRoomWithRoomManager } from '../utils/roomManager';
import { FishjamLogo } from '../assets';
import { useConnection, useSandbox } from '@fishjam-cloud/react-native-client';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'ConnectWithVideoRoom'>,
  NativeStackScreenProps<AppRootStackParamList>
>;

type VideoRoomEnv = 'staging' | 'prod';

type VideoRoomData = {
  videoRoomEnv: VideoRoomEnv;
  roomName: string;
  userName: string;
};

async function saveStorageData(videoRoomData: VideoRoomData) {
  await AsyncStorage.setItem('videoRoomData', JSON.stringify(videoRoomData));
}

async function readStorageData(): Promise<VideoRoomData> {
  const storageData = await AsyncStorage.getItem('videoRoomData');
  if (storageData) {
    const videoRoomData = JSON.parse(storageData) as VideoRoomData;
    return videoRoomData;
  }
  return { videoRoomEnv: 'staging', roomName: '', userName: '' };
}

/**
 * Connect with the VideoRoom - our example service for video conferences
 */
export default function ConnectScreen({ navigation }: Props) {
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [videoRoomEnv, setVideoRoomEnv] = useState<VideoRoomEnv>('staging');
  const [loading, setLoading] = useState(false);

  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');

  const { getSandboxPeerToken } = useSandbox({
    fishjamId: videoRoomEnv !== "staging" ? process.env.EXPO_PUBLIC_FISHJAM_ID : undefined,
    sandboxApiUrl: videoRoomEnv === "staging" ? process.env.EXPO_PUBLIC_VIDEOROOM_STAGING_SANDBOX_URL : undefined
  });

  useEffect(() => {
    async function readData() {
      const {
        videoRoomEnv: storedVideoRoomEnv,
        roomName: storedRoomName,
        userName: storedUserName,
      } = await readStorageData();

      setRoomName(storedRoomName);
      setUserName(storedUserName);
      setVideoRoomEnv(storedVideoRoomEnv);
    }
    readData();
  }, []);

  const onTapConnectButton = async () => {
    try {
      setConnectionError(null);
      setLoading(true);
      saveStorageData({ videoRoomEnv: videoRoomEnv, roomName, userName });

      const peerToken = await getSandboxPeerToken(roomName, userName);
      
      const fishjamId = process.env.EXPO_PUBLIC_FISHJAM_ID

      navigation.navigate('Preview', {
        userName,
        fishjamId,
        peerToken: peerToken,
      });
    } catch (e) {
      const message =
        'message' in (e as Error) ? (e as Error).message : 'Unknown error';
        console.log(message)
      setConnectionError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DismissKeyboard>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior="height" style={styles.container}>
          {connectionError && (
            <Text style={styles.errorMessage}>{connectionError}</Text>
          )}
          <Image
            style={styles.logo}
            source={FishjamLogo}
            resizeMode="contain"
          />
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              rowGap: 10,
            }}>
            <Button
              title="Staging"
              type={videoRoomEnv === 'staging' ? 'primary' : 'secondary'}
              onPress={() => setVideoRoomEnv('staging')}
              disabled={loading}
            />
            <Button
              title="Production"
              type={videoRoomEnv === 'prod' ? 'primary' : 'secondary'}
              onPress={() => setVideoRoomEnv('prod')}
              disabled={loading}
            />
          </View>
          <TextInput
            onChangeText={setRoomName}
            placeholder="Room Name"
            defaultValue={roomName}
          />
          <TextInput
            onChangeText={setUserName}
            placeholder="User Name"
            defaultValue={userName}
          />
          <Button
            title="Connect"
            onPress={onTapConnectButton}
            disabled={loading}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </DismissKeyboard>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#BFE7F8',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#BFE7F8',
    padding: 20,
    gap: 24,
  },
  errorMessage: {
    color: 'black',
    textAlign: 'center',
    margin: 25,
    fontSize: 20,
  },
  logo: {
    width: Dimensions.get('window').width - 40,
  },
});
