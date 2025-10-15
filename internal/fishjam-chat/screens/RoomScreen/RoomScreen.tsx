import {
  useConnection,
  useAudioSettings,
  useCamera,
  useForegroundService,
  useMicrophone,
  usePeers,
  useScreenShare,
  useCallKitService,
  useCallKitEvent,
  usePictureInPicture,
} from '@fishjam-cloud/react-native-client';
import BottomSheet from '@gorhom/bottom-sheet';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef } from 'react';
import { Platform, SafeAreaView, StyleSheet, View } from 'react-native';

import {
  InCallButton,
  SoundOutputDevicesBottomSheet,
  VideosGrid,
} from '../../components';
import { usePreventBackButton } from '../../hooks/usePreventBackButton';
import type { AppRootStackParamList } from '../../navigators/AppNavigator';
import { roomScreenLabels } from '../../types/ComponentLabels';
import { PeerMetadata } from '../../types/metadata';
import { ToggleAppScreenButton } from './ToggleAppScreenShare.ios';

type Props = NativeStackScreenProps<AppRootStackParamList, 'Room'>;
const {
  DISCONNECT_BUTTON,
  TOGGLE_CAMERA_BUTTON,
  SWITCH_CAMERA_BUTTON,
  SHARE_SCREEN_BUTTON,
  TOGGLE_MICROPHONE_BUTTON,
} = roomScreenLabels;
const defaultUserName = 'username';

const RoomScreen = ({ navigation, route }: Props) => {
  const { userName } = route?.params ?? {};
  usePreventBackButton();
  const audioSettings = useAudioSettings();

  const { isCameraOn, toggleCamera, cameras, currentCamera, switchCamera } =
    useCamera();
  const { isMicrophoneOn, toggleMicrophone, startMicrophone, stopMicrophone } =
    useMicrophone();

  const { localPeer, remotePeers } = usePeers<PeerMetadata>();

  const { setPipActiveTrackId } = usePictureInPicture();

  useEffect(() => {
    const localTrack = localPeer?.tracks.find(
      (track) => track.type === 'Video',
    );
    if (localTrack) {
      setPipActiveTrackId(localTrack.id);
    }
  }, [localPeer, setPipActiveTrackId]);

  const { toggleScreenShare, isScreenShareOn } = useScreenShare();

  const { leaveRoom } = useConnection();

  const onDisconnectPress = useCallback(() => {
    leaveRoom();
    navigation.navigate('Home');
  }, [navigation, leaveRoom]);

  useForegroundService({
    channelId: 'io.fishjam.example.fishjamchat.foregroundservice.channel',
    channelName: 'Fishjam Chat Notifications',
    notificationTitle: 'Your video call is ongoing',
    notificationContent: 'Tap to return to the call.',
    enableCamera: isCameraOn,
    enableMicrophone: isMicrophoneOn,
  });

  useCallKitService({
    displayName: userName ?? defaultUserName,
    isVideo: true,
  });

  useCallKitEvent('ended', () => {
    leaveRoom();
    navigation.navigate('Home');
  });

  useCallKitEvent('muted', (isMuted) => {
    if (isMuted) {
      stopMicrophone();
    } else {
      startMicrophone();
    }
  });

  useCallKitEvent('held', (isHeld) => {
    if (isHeld) {
      stopMicrophone();
    } else {
      startMicrophone();
    }
  });

  const onToggleScreenShare = useCallback(async () => {
    await toggleScreenShare({
      quality: 'HD15',
    });
  }, [toggleScreenShare]);

  const flipCamera = useCallback(() => {
    const camera =
      cameras.find(
        (cam) => cam.facingDirection !== currentCamera?.facingDirection,
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
      <VideosGrid
        localPeer={localPeer}
        remotePeers={remotePeers}
        username={userName ?? defaultUserName}
      />

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
        {Platform.OS === 'ios' && <ToggleAppScreenButton />}
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
