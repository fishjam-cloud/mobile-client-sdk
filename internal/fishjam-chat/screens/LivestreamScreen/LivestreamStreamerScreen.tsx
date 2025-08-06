import {
  LivestreamStreamer,
  useLivestreamStreamer,
  useSandbox,
  cameras,
} from '@fishjam-cloud/react-native-client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect } from 'react';
import {
  Button,
  SafeAreaView,
  StyleSheet,
  View,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { AppRootStackParamList } from '../../navigators/AppNavigator';
import { BrandColors } from '../../utils/Colors';

type Props = NativeStackScreenProps<
  AppRootStackParamList,
  'LivestreamStreamerScreen'
>;

export async function checkPermissions() {
  if (Platform.OS === 'ios') {
    return;
  }
  try {
    await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ]);
  } catch (err) {
    console.warn(err);
  }
}

export default function LivestreamStreamerScreen({ route }: Props) {
  const { fishjamId, roomName } = route.params;

  const { getSandboxLivestream } = useSandbox({
    fishjamId,
  });

  const {
    connect,
    disconnect,
    isConnected,
    getSupportedVideoCodecs,
    setPreferredVideoCodecs,
  } = useLivestreamStreamer({
    camera: cameras[0],
  });

  console.log('Streamer Connected:', isConnected);

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

  useEffect(() => {
    checkPermissions();

    const supportedVideoCodecs = getSupportedVideoCodecs();
    const vp8 = supportedVideoCodecs.find((codec) => codec === 'VP8');
    if (vp8) {
      setPreferredVideoCodecs([vp8]);
    }

    return () => {
      disconnect();
    };
  }, [disconnect, getSupportedVideoCodecs, setPreferredVideoCodecs]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.box}>
        <View style={styles.videoView}>
          <LivestreamStreamer style={styles.whepView} />
          <Button
            title={isConnected ? 'Disconnect' : 'Connect'}
            onPress={isConnected ? handleDisconnect : handleConnect}
          />
        </View>
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
