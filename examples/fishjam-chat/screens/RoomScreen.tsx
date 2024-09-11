import {
  leaveRoom,
  useParticipants,
  useScreencast,
  useCamera,
  useMicrophone,
  useAudioSettings,
} from '@fishjam-cloud/react-native-client';
import BottomSheet from '@gorhom/bottom-sheet';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useRef } from 'react';
import { Platform, SafeAreaView, StyleSheet, View } from 'react-native';

import {
  InCallButton,
  VideosGrid,
  NoCameraView,
  SoundOutputDevicesBottomSheet,
} from '../components';
import { usePreventBackButton } from '../hooks/usePreventBackButton';
import type { AppRootStackParamList } from '../navigators/AppNavigator';
import { roomScreenLabels } from '../types/ComponentLabels';
import { parseParticipantsToTracks } from '../components/VideosGrid';
import { ParticipantMetadata } from '../types/metadata';
import { useStartForegroundService } from '../hooks/useStartForegroundService';

type Props = NativeStackScreenProps<AppRootStackParamList, 'Room'>;
const {
  DISCONNECT_BUTTON,
  TOGGLE_CAMERA_BUTTON,
  SWITCH_CAMERA_BUTTON,
  SHARE_SCREEN_BUTTON,
  TOGGLE_MICROPHONE_BUTTON,
  NO_CAMERA_VIEW,
} = roomScreenLabels;

const RoomScreen = ({ navigation, route }: Props) => {
  const { userName } = route?.params ?? {};
  usePreventBackButton();
  const audioSettings = useAudioSettings();

  const { isCameraOn, flipCamera, toggleCamera } = useCamera();
  const { isMicrophoneOn, toggleMicrophone } = useMicrophone();

  useStartForegroundService();

  const { participants: participants } = useParticipants<ParticipantMetadata>();

  const tracks = useMemo(
    () => parseParticipantsToTracks(participants),
    [participants],
  );

  const { toggleScreencast, isScreencastOn, handleScreencastPermission } =
    useScreencast();

  const onDisconnectPress = useCallback(() => {
    leaveRoom();
    navigation.navigate('Home');
  }, [navigation]);

  const onToggleScreenCast = useCallback(async () => {
    if (!isScreencastOn && Platform.OS === 'android') {
      if ((await handleScreencastPermission()) != 'granted') {
        return;
      }
    }
    await toggleScreencast({
      quality: 'HD15',
    });
  }, [isScreencastOn, toggleScreencast, handleScreencastPermission]);

  const bottomSheetRef = useRef<BottomSheet>(null);

  const toggleOutputSoundDevice = useCallback(async () => {
    if (Platform.OS === 'ios') {
      await audioSettings.showAudioRoutePicker();
    } else if (Platform.OS === 'android') {
      bottomSheetRef.current?.expand();
    }
  }, [audioSettings]);

  return (
    <SafeAreaView style={styles.container}>
      {tracks.length > 0 ? (
        <VideosGrid tracks={tracks} />
      ) : (
        <NoCameraView
          username={userName || 'username'}
          accessibilityLabel={NO_CAMERA_VIEW}
        />
      )}

      <View style={styles.callView}>
        <InCallButton
          type="disconnect"
          iconName="phone-hangup"
          onPress={onDisconnectPress}
          accessibilityLabel={DISCONNECT_BUTTON}
        />
        <InCallButton
          iconName={isMicrophoneOn ? 'microphone' : 'microphone-off'}
          onPress={toggleMicrophone}
          accessibilityLabel={TOGGLE_MICROPHONE_BUTTON}
        />
        <InCallButton
          iconName={isCameraOn ? 'camera' : 'camera-off'}
          onPress={toggleCamera}
          accessibilityLabel={TOGGLE_CAMERA_BUTTON}
        />
        <InCallButton
          iconName="camera-switch"
          onPress={flipCamera}
          accessibilityLabel={SWITCH_CAMERA_BUTTON}
        />
        <InCallButton
          iconName={isScreencastOn ? 'share' : 'share-off'}
          onPress={onToggleScreenCast}
          accessibilityLabel={SHARE_SCREEN_BUTTON}
        />
        <InCallButton
          iconName="volume-high"
          onPress={toggleOutputSoundDevice}
        />
      </View>
      {Platform.OS === 'android' ? (
        <SoundOutputDevicesBottomSheet bottomSheetRef={bottomSheetRef} />
      ) : null}
    </SafeAreaView>
  );
};

export default RoomScreen;

const styles = StyleSheet.create({
  callView: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 10,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#F1FAFE',
  },
});
