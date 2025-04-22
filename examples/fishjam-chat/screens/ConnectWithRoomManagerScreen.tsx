import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  SafeAreaView,
  StyleSheet,
  Text,
} from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';

import { Button, TextInput, DismissKeyboard } from '../components';
import RoomTypeSelector from '../components/RoomTypeSelector';
import RoomTypeSelectorBottomSheet from '../components/RoomTypeSelectorBottomSheet';
import {
  AppRootStackParamList,
  TabParamList,
} from '../navigators/AppNavigator';
import { joinRoomWithRoomManager, RoomType } from '../utils/roomManager';
import { FishjamLogo } from '../assets';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'ConnectWithRoomManager'>,
  NativeStackScreenProps<AppRootStackParamList>
>;

export default function ConnectScreen({ navigation }: Props) {
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [roomManagerUrl, setRoomManagerUrl] = useState(
    process.env.EXPO_PUBLIC_ROOM_MANAGER_URL ?? '',
  );
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');
  const [roomType, setRoomType] = useState<RoomType>('full_feature');

  const roomTypeSelectorRef = useRef<BottomSheet>(null);

  const openRoomTypeSelector = () => {
    roomTypeSelectorRef.current?.expand();
  };

  const onTapConnectButton = async () => {
    try {
      setConnectionError(null);
      setLoading(true);
      const { fishjamUrl, token } = await joinRoomWithRoomManager(
        roomManagerUrl,
        roomName,
        userName,
        roomType,
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
            source={FishjamLogo}
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
          <RoomTypeSelector
            selectedType={roomType}
            onOpenSelector={openRoomTypeSelector}
          />
          <Button
            title="Connect"
            onPress={onTapConnectButton}
            disabled={loading}
          />
        </KeyboardAvoidingView>

        <RoomTypeSelectorBottomSheet
          bottomSheetRef={roomTypeSelectorRef}
          selectedType={roomType}
          onSelectType={setRoomType}
        />
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
