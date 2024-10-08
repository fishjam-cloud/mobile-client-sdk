import {
  leaveRoom,
  usePeers,
  useScreenShare,
  useCamera,
  useMicrophone,
  useAudioSettings,
  useAppScreenShare,
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
import { parsePeersToTracks } from '../components/VideosGrid';
import { PeerMetadata } from '../types/metadata';
import { useForegroundService } from '../hooks/useForegroundService';

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

  const { isCameraOn, toggleCamera, cameras, currentCamera, switchCamera } =
    useCamera();
  const { isMicrophoneOn, toggleMicrophone } = useMicrophone();

  const { peers } = usePeers<PeerMetadata>();

  const tracks = useMemo(() => parsePeersToTracks(peers), [peers]);

  const { toggleScreenShare, isScreenShareOn, handleScreenSharePermission } =
    useScreenShare();

  const iosAppScreenShare = useAppScreenShare();

  const onDisconnectPress = useCallback(() => {
    leaveRoom();
    navigation.navigate('Home');
  }, [navigation]);

  useForegroundService({
    enableCamera: isCameraOn,
    enableMicrophone: isMicrophoneOn,
  });

  const handleAndroidScreenSharePermission = useCallback(
    async (isScreenShareOn: boolean) => {
      if (isScreenShareOn) {
        return;
      }
      if ((await handleScreenSharePermission()) != 'granted') {
        return;
      }
    },
    [handleScreenSharePermission],
  );

  const onToggleScreenShare = useCallback(async () => {
    if (Platform.OS === 'android') {
      await handleAndroidScreenSharePermission(isScreenShareOn);
    }

    await toggleScreenShare({
      quality: 'HD15',
    });
  }, [isScreenShareOn, toggleScreenShare, handleAndroidScreenSharePermission]);

  const flipCamera = useCallback(() => {
    const camera =
      cameras.find(
        (camera) => camera.facingDirection !== currentCamera?.facingDirection,
      ) || null;
    if (camera) {
      switchCamera(camera.id);
    }
  }, [cameras, currentCamera?.facingDirection, switchCamera]);

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
          iconName={isScreenShareOn ? 'share' : 'share-off'}
          onPress={onToggleScreenShare}
          accessibilityLabel={SHARE_SCREEN_BUTTON}
        />
        {Platform.OS === 'ios' ? (
          <InCallButton
            iconName={
              iosAppScreenShare?.isAppScreenShareOn
                ? 'cellphone-screenshot'
                : 'cellphone-off'
            }
            onPress={() => {
              iosAppScreenShare?.toggleAppScreenShare();
            }}
          />
        ) : null}

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
