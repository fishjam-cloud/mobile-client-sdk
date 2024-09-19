import {
  useCamera,
  useMicrophone,
  joinRoom,
  VideoPreviewView,
  leaveRoom,
} from '@fishjam-cloud/react-native-client';
import BottomSheet from '@gorhom/bottom-sheet';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef } from 'react';
import {
  Button,
  Platform,
  SafeAreaView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

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
import { ParticipantMetadata } from '../../types/metadata';

type Props = NativeStackScreenProps<AppRootStackParamList, 'Preview'>;
type BottomSheetRef = Props & {
  bottomSheetRef: React.RefObject<BottomSheet>;
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

  const toggleSwitchCamera = () => {
    const camera =
      cameras.find(
        (camera) => camera.facingDirection !== currentCamera?.facingDirection,
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
  }, [prepareCamera, navigation]);

  const onJoinPressed = async () => {
    await joinRoom<ParticipantMetadata>(
      route.params.fishjamUrl,
      route.params.participantToken,
      {
        name: route.params.userName,
      },
    );

    unsubscribeBeforeRemove();

    navigation.navigate('Room', {
      isCameraOn,
      userName: route?.params?.userName,
    });
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
          <VideoPreviewView style={styles.cameraPreviewView} />
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

  if (Platform.OS === 'android') {
    return (
      <TouchableWithoutFeedback onPress={() => bottomSheetRef.current?.close()}>
        <PreviewScreen
          navigation={navigation}
          route={route}
          bottomSheetRef={bottomSheetRef}
        />
      </TouchableWithoutFeedback>
    );
  }
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
    alignSelf: 'stretch',
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
  },
  cameraPreviewView: {
    width: '100%',
    height: '100%',
  },
});
