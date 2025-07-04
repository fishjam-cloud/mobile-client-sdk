import {
  useCamera,
  useMicrophone,
  useConnection,
  VideoPreviewView,
} from '@fishjam-cloud/react-native-client';
import BottomSheet from '@gorhom/bottom-sheet';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef } from 'react';
import { Platform, SafeAreaView, StyleSheet, View, Button } from 'react-native';

import { SwitchCameraButton } from './SwitchCameraButton';
import { SwitchOutputDeviceButton } from './SwitchOutputDeviceButton';
import { ToggleCameraButton } from './ToggleCameraButton';
import {
  InCallButton,
  NoCameraView,
  SoundOutputDevicesBottomSheet,
} from '../../components';
import { usePreventBackButton } from '../../hooks/usePreventBackButton';
import type { AppRootStackParamList } from '../../navigators/AppNavigator';
import { previewScreenLabels } from '../../types/ComponentLabels';
import { BrandColors } from '../../utils/Colors';
import {
  displayIosSimulatorCameraAlert,
  isIosSimulator,
} from '../../utils/deviceUtils';
import { PeerMetadata } from '../../types/metadata';

type Props = NativeStackScreenProps<AppRootStackParamList, 'Preview'>;
type BottomSheetRef = Props & {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
};

const { JOIN_BUTTON, TOGGLE_MICROPHONE_BUTTON } = previewScreenLabels;

let unsubscribeBeforeRemove: () => void;

function PreviewScreen({
  navigation,
  route,
  bottomSheetRef,
}: Props & BottomSheetRef) {
  const {
    prepareCamera,
    cameras,
    isCameraOn,
    switchCamera,
    toggleCamera,
    currentCamera,
  } = useCamera();
  const { isMicrophoneOn, toggleMicrophone } = useMicrophone();
  const { joinRoom, leaveRoom } = useConnection();

  const toggleSwitchCamera = () => {
    const camera =
      cameras.find(
        (cam) => cam.facingDirection !== currentCamera?.facingDirection,
      ) || null;
    if (camera) {
      switchCamera(camera.id);
    }
  };

  useEffect(() => {
    prepareCamera({
      simulcastEnabled: true,
      quality: 'HD169',
      cameraEnabled: true,
    });

    unsubscribeBeforeRemove = navigation.addListener('beforeRemove', () => {
      leaveRoom();
    });
  }, [prepareCamera, navigation, leaveRoom]);

  const onJoinPressed = async () => {
    try {
      await joinRoom<PeerMetadata>({
        url: route.params.fishjamUrl,
        peerToken: route.params.peerToken,
        peerMetadata: {
          displayName: route.params.userName,
        },
      });
      unsubscribeBeforeRemove();

      navigation.navigate('Room', {
        isCameraOn,
        userName: route?.params?.userName,
      });
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    if (isIosSimulator) {
      displayIosSimulatorCameraAlert();
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cameraPreview}>
        {!isIosSimulator && isCameraOn ? (
          <VideoPreviewView
            style={styles.cameraPreviewView}
            videoLayout="FIT"
          />
        ) : (
          <NoCameraView username={route?.params?.userName || 'RN Mobile'} />
        )}
      </View>
      <View style={styles.mediaButtonsWrapper}>
        <InCallButton
          iconName={isMicrophoneOn ? 'microphone' : 'microphone-off'}
          onPress={toggleMicrophone}
          accessibilityLabel={TOGGLE_MICROPHONE_BUTTON}
        />
        <ToggleCameraButton
          toggleCamera={toggleCamera}
          isCameraOn={isCameraOn}
        />
        <SwitchCameraButton switchCamera={toggleSwitchCamera} />
        <SwitchOutputDeviceButton bottomSheetRef={bottomSheetRef} />
      </View>
      <View style={styles.joinButton}>
        <Button
          title="Join Room"
          onPress={onJoinPressed}
          accessibilityLabel={JOIN_BUTTON}
        />
      </View>

      {Platform.OS === 'android' && (
        <SoundOutputDevicesBottomSheet bottomSheetRef={bottomSheetRef} />
      )}
    </SafeAreaView>
  );
}

export default function PreviewScreenWrapper({ navigation, route }: Props) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  usePreventBackButton();

  return (
    <PreviewScreen
      navigation={navigation}
      route={route}
      bottomSheetRef={bottomSheetRef}
    />
  );
}

const styles = StyleSheet.create({
  callView: { display: 'flex', flexDirection: 'row', gap: 20 },
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F1FAFE',
    padding: 24,
  },
  cameraPreview: {
    flex: 6,
    margin: 24,
    aspectRatio: 9 / 16,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BrandColors.darkBlue80,
    overflow: 'hidden',
  },
  mediaButtonsWrapper: {
    display: 'flex',
    flexDirection: 'row',
    gap: 20,
    flex: 1,
  },
  simulcastButtonsWrapper: {
    display: 'flex',
    flexDirection: 'row',
    gap: 20,
    flex: 1,
  },
  joinButton: {
    flex: 1,
    padding: 20,
  },
  cameraPreviewView: {
    width: '100%',
    height: '100%',
  },
});
