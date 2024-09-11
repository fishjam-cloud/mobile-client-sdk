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
    'SFMyNTY.g2gDdAAAAAJkAAdwZWVyX2lkbQAAACQyMGRmZmJhYi0wZmFhLTRjOTQtYTc4Mi1lZmMxNWNiOGY2YjlkAAdyb29tX2lkbQAAAERhMzg3LTRjZTEtYmM2ZS0zOTBhZTgzODVhNzktNmE2NTZjNmM3OTY2Njk3MzY4NDAzMTMwMmUzMDJlMzEyZTMyMzUzMm4GAI741eCRAWIAAVGA.c7xYwO5hHhnn5lv_5kFu_gMn-F4oMQp8wRJ2u8VcABg',
  );
  const [fishjamUrl, onChangeFishjamUrl] = useState(
    'wss://cloud.fishjam.work/api/v1/connect/5c24e323ea9b4b37b9b138e34a43c593',
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
