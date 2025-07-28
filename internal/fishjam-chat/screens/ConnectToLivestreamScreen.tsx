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

  const [livestreamUrl, setLivestreamUrl] = useState('');
  const [viewerToken, setViewerToken] = useState('');

  const onTapConnectViewerButton = async () => {
    try {
      setConnectionError(null);
      setLoading(true);

      navigation.navigate('LivestreamViewerScreen');
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
      setConnectionError(null);
      setLoading(true);

      navigation.navigate('LivestreamStreamerScreen');
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
