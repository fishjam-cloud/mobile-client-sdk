import { useSandbox } from '@fishjam-cloud/react-native-client';
import {
  LivestreamStreamer,
  useLivestreamStreamer,
  cameras,
  VideoParameters,
} from '@fishjam-cloud/react-native-client/livestream';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback } from 'react';
import { Button, SafeAreaView, StyleSheet, View } from 'react-native';
import { AppRootStackParamList } from '../../navigators/AppNavigator';
import { BrandColors } from '../../utils/Colors';

type Props = NativeStackScreenProps<
  AppRootStackParamList,
  'LivestreamStreamerScreen'
>;

export default function LivestreamStreamerScreen({ route }: Props) {
  const { fishjamId, roomName } = route.params;

  const { getSandboxLivestream } = useSandbox({
    fishjamId,
  });

  const {
    connect,
    disconnect,
    flipCamera,
    switchCamera,
    currentCameraDeviceId,
    isConnected,
    whipClientRef,
  } = useLivestreamStreamer({
    videoEnabled: true,
    audioEnabled: true,
    camera: cameras[0],
    videoParameters: VideoParameters.presetHD169,
  });

  const handleConnect = useCallback(async () => {
    try {
      const { streamerToken } = await getSandboxLivestream(roomName, false);
      await connect(streamerToken);
    } catch (err) {
      console.log(err);
    }
  }, [connect, getSandboxLivestream, roomName]);

  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  const handleFlipCamera = useCallback(() => {
    flipCamera();
  }, [flipCamera]);

  const handleSwitchCamera = useCallback(async () => {
    const currentCameraId = await currentCameraDeviceId();
    const currentCamera = cameras.find((cam) => cam.id === currentCameraId);

    const oppositeCamera = cameras.find(
      (cam) =>
        cam.facingDirection !== currentCamera?.facingDirection &&
        cam.facingDirection !== 'unspecified',
    );

    if (oppositeCamera) {
      switchCamera(oppositeCamera.id);
    }
  }, [switchCamera, currentCameraDeviceId]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.box}>
        <View style={styles.videoView}>
          <LivestreamStreamer style={styles.whepView} ref={whipClientRef} />
          <Button
            title={isConnected ? 'Disconnect' : 'Connect'}
            onPress={isConnected ? handleDisconnect : handleConnect}
          />
        </View>
        <Button title="Flip Camera" onPress={handleFlipCamera} />
        <Button title="Switch Camera" onPress={handleSwitchCamera} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1FAFE',
    padding: 24,
  },
  box: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  videoView: {
    width: '100%',
    height: '70%',
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BrandColors.darkBlue80,
  },
  whepView: {
    flex: 1,
    backgroundColor: '#000',
  },
});
