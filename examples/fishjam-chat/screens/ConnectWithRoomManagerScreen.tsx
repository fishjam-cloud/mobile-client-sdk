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
import { URL } from 'react-native-url-polyfill';

import { Button, TextInput, DismissKeyboard } from '../components';
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
    token: tokenData.participantToken,
  };
}

export default function ConnectScreen({ navigation }: Props) {
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [roomManagerUrl, setRoomManagerUrl] = useState(
    process.env.EXPO_PUBLIC_ROOM_MANAGER_URL ??
      'https://fishjam.io/api/v1/connect/14e9c99eb7264a5595b04dd818be56d7/room-manager',
  );
  const [roomName, setRoomName] = useState('test');
  const [userName, setUserName] = useState('test1');

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
            defaultValue={roomManagerUrl}
            placeholder="Room Manager URL"
          />
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
