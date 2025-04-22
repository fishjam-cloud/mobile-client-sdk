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

  const onTapConnectButton = async () => {
    try {
      if (!livestreamUrl) {
        setConnectionError('Livestream URL is required');
        return;
      }

      if (!viewerToken) {
        setConnectionError('Viewer token is required');
        return;
      }

      setConnectionError(null);
      setLoading(true);

      navigation.navigate('LivestreamScreen', {
        livestreamUrl,
        viewerToken,
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
            onChangeText={setLivestreamUrl}
            placeholder="Livestream URL"
            defaultValue={livestreamUrl}
          />
          <TextInput
            onChangeText={setViewerToken}
            placeholder="Viewer Token"
            defaultValue={viewerToken}
          />
          <Button
            title="Connect to Livestream"
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
