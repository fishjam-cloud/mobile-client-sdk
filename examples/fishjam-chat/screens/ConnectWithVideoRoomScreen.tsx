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

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'ConnectWithVideoRoom'>,
  NativeStackScreenProps<AppRootStackParamList>
>;

type VideoRoomEnv = 'staging' | 'prod';

type VideoRoomData = {
  env: VideoRoomEnv;
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
  return { env: 'staging', roomName: '', userName: '' };
}

export function shouldShowVideoRoomTab() {
  return (
    !!process.env.EXPO_PUBLIC_VIDEOROOM_STAGING &&
    !!process.env.EXPO_PUBLIC_VIDEOROOM_PRODUCTION
  );
}

/**
 * Connect with the VideoRoom - our example service for video conferences
 */
export default function ConnectScreen({ navigation }: Props) {
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [env, setEnv] = useState<VideoRoomEnv>('staging');
  const [loading, setLoading] = useState(false);

  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    async function readData() {
      const {
        env: storedEnv,
        roomName: storedRoomName,
        userName: storedUserName,
      } = await readStorageData();

      setRoomName(storedRoomName);
      setUserName(storedUserName);
      setEnv(storedEnv);
    }
    readData();
  }, []);

  const onTapConnectButton = async () => {
    try {
      setConnectionError(null);
      setLoading(true);
      const roomManagerUrl =
        env === 'staging'
          ? process.env.EXPO_PUBLIC_VIDEOROOM_STAGING!
          : process.env.EXPO_PUBLIC_VIDEOROOM_PRODUCTION!;
      saveStorageData({ env, roomName, userName });

      const { fishjamUrl, token } = await joinRoomWithRoomManager(
        roomManagerUrl,
        roomName,
        userName,
      );

      navigation.navigate('Preview', {
        userName,
        fishjamUrl,
        peerToken: token,
      });
    } catch (e) {
      const message =
        'message' in (e as Error) ? (e as Error).message : 'Unknown error';
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
            source={require('../assets/fishjam-logo.png')}
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
              type={env === 'staging' ? 'primary' : 'secondary'}
              onPress={() => setEnv('staging')}
              disabled={loading}
            />
            <Button
              title="Production"
              type={env === 'prod' ? 'primary' : 'secondary'}
              onPress={() => setEnv('prod')}
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

const windowWidth = Dimensions.get('window').width;

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
    width: windowWidth - 40,
  },
});
