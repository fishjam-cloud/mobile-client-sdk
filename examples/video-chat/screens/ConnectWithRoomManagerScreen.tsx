import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  SafeAreaView,
  StyleSheet,
  Text,
} from 'react-native';

import { Button, TextInput, DismissKeyboard } from '../components';
import { usePermissionCheck } from '../hooks/usePermissionCheck';
import {
  AppRootStackParamList,
  TabParamList,
} from '../navigators/AppNavigator';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'ConnectWithRoomManager'>,
  NativeStackScreenProps<AppRootStackParamList>
>;

async function getFishjamServer(
  roomManagerUrl: string,
  roomName: string,
  userName: string,
) {
  // in case user copied url from admin panel
  const urlWithoutParams = roomManagerUrl.replace(
    '/*roomName*/users/*username*',
    '',
  );
  // trim slash from end
  const url = urlWithoutParams.endsWith('/')
    ? urlWithoutParams
    : urlWithoutParams + '/';
  const response = await fetch(
    `${url}${roomName.trim()}/users/${userName.trim()}`,
  );
  if (!response.ok) {
    throw new Error(JSON.stringify(await response.json()));
  }
  const tokenData = (await response.json()) as {
    url: string;
    token: string;
  };

  return {
    fishjamUrl: `${tokenData.url}/socket/peer/websocket`,
    token: tokenData.token,
  };
}

const ConnectScreen = ({ navigation }: Props) => {
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [roomManagerUrl, setRoomManagerUrl] = useState(
    process.env.EXPO_PUBLIC_ROOM_MANAGER_URL ?? '',
  );
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');
  usePermissionCheck();

  const onTapConnectButton = async () => {
    try {
      setConnectionError(null);
      setLoading(true);
      const { fishjamUrl, token } = await getFishjamServer(
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
          <TextInput
            onChangeText={setRoomManagerUrl}
            value={roomManagerUrl}
            placeholder="Room Manager URL"
          />
          <TextInput onChangeText={setRoomName} placeholder="Room Name" />
          <TextInput onChangeText={setUserName} placeholder="User Name" />
          <Button
            title="Connect"
            onPress={onTapConnectButton}
            disabled={loading}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </DismissKeyboard>
  );
};

export default ConnectScreen;

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
