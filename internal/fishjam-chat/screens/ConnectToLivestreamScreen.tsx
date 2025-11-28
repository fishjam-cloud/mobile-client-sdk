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
import {
  AppRootStackParamList,
  TabParamList,
} from '../navigators/AppNavigator';
import { FishjamLogo } from '../assets';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'ConnectToLivestream'>,
  NativeStackScreenProps<AppRootStackParamList>
>;

export default function ConnectToLivestreamScreen({ navigation }: Props) {
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [fishjamId, setFishjamId] = useState(
    process.env.EXPO_PUBLIC_FISHJAM_ID ?? '',
  );
  const [roomName, setRoomName] = useState('');

  const validateInputs = () => {
    if (!fishjamId) {
      throw new Error('Fishjam ID is required');
    }

    if (!roomName) {
      throw new Error('Room name is required');
    }
  };

  const onTapConnectViewerButton = async () => {
    try {
      validateInputs();
      setConnectionError(null);
      setLoading(true);

      navigation.navigate('LivestreamViewerScreen', {
        fishjamId,
        roomName,
      });
    } catch (e) {
      const message =
        'message' in (e as Error) ? (e as Error).message : 'Unknown error';
      setConnectionError(message);
    } finally {
      setLoading(false);
    }
  };
  const onTapConnectStreamerButton = async () => {
    try {
      validateInputs();
      setConnectionError(null);
      setLoading(true);

      navigation.navigate('LivestreamStreamerScreen', {
        fishjamId,
        roomName,
      });
    } catch (e) {
      const message =
        'message' in (e as Error) ? (e as Error).message : 'Unknown error';
      setConnectionError(message);
    } finally {
      setLoading(false);
    }
  };
  const onTapConnectScreenSharingButton = async () => {
    try {
      validateInputs();
      setConnectionError(null);
      setLoading(true);

      navigation.navigate('LivestreamScreenSharingScreen', {
        fishjamId,
        roomName,
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
            source={FishjamLogo}
            resizeMode="contain"
          />
          <TextInput
            onChangeText={setFishjamId}
            placeholder="Fishjam ID"
            defaultValue={fishjamId}
          />
          <TextInput
            onChangeText={setRoomName}
            placeholder="Room Name"
            defaultValue={roomName}
          />
          <Button
            title="Connect to Livestream"
            onPress={onTapConnectViewerButton}
            disabled={loading}
          />
          <Button
            title="Stream Livestream"
            onPress={onTapConnectStreamerButton}
            disabled={loading}
          />
          <Button
            title="Stream Screen Sharing"
            onPress={onTapConnectScreenSharingButton}
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
