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

import {
  Button,
  TextInput,
  QRCodeScanner,
  DismissKeyboard,
} from '../components';
import { usePermissionCheck } from '../hooks/usePermissionCheck';
import {
  TabParamList,
  AppRootStackParamList,
} from '../navigators/AppNavigator';
import { connectScreenLabels } from '../types/ComponentLabels';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'ConnectWithToken'>,
  NativeStackScreenProps<AppRootStackParamList>
>;

const { URL_INPUT, TOKEN_INPUT, CONNECT_BUTTON } = connectScreenLabels;
const ConnectScreen = ({ navigation }: Props) => {
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const [peerToken, onChangePeerToken] = useState(
    'SFMyNTY.g2gDdAAAAAJkAAdwZWVyX2lkbQAAACQ0OTY2MzI1My02ZTk1LTQ5YTMtYjBhMC01ZGFhMjczNTViY2NkAAdyb29tX2lkbQAAAEZjOWY1LTQyZGYtYjBjNC0xZTY2ODAwMmU2YjMtNjY2OTczNjg2YTYxNmQ0MDMxMzAyZTMyMzQzMDJlMzMzMjJlMzEzMzM2bgYAUbO5M5IBYgABUYA.KkYoWt7Zw49xGiGmff5E_UVhlNX6lGqEckAAUHxoiJk',
  );
  const [fishjamUrl, onChangeFishjamUrl] = useState(
    'wss://fishjam.io/api/v1/connect/14e9c99eb7264a5595b04dd818be56d7"',
  );

  usePermissionCheck();

  const onTapConnectButton = async () => {
    try {
      setConnectionError(null);
      navigation.navigate('Preview', {
        fishjamUrl: fishjamUrl.trim(),
        peerToken: peerToken.trim(),
      });
    } catch (e) {
      const message =
        'message' in (e as Error) ? (e as Error).message : 'Unknown error';
      setConnectionError(message);
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
            onChangeText={onChangeFishjamUrl}
            defaultValue={fishjamUrl}
            accessibilityLabel={URL_INPUT}
            placeholder="Fishjam URL"
          />
          <TextInput
            onChangeText={onChangePeerToken}
            defaultValue={peerToken}
            accessibilityLabel={TOKEN_INPUT}
            placeholder="Peer Token"
          />
          <Button
            title="Connect"
            onPress={onTapConnectButton}
            accessibilityLabel={CONNECT_BUTTON}
          />
          <QRCodeScanner onCodeScanned={onChangePeerToken} />
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
