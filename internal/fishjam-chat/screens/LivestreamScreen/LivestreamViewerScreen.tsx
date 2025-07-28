import {
  LivestreamViewer,
  useLivestreamViewer,
  useSandbox,
} from '@fishjam-cloud/react-native-client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { AppRootStackParamList } from '../../navigators/AppNavigator';
import { BrandColors } from '../../utils/Colors';

type Props = NativeStackScreenProps<
  AppRootStackParamList,
  'LivestreamViewerScreen'
>;

export default function LivestreamViewerScreen({ route }: Props) {
  const { fishjamId, roomName } = route.params;

  const { getSandboxViewerToken } = useSandbox({
    fishjamId,
  });

  const { connect, disconnect } = useLivestreamViewer();

  const handleConnect = useCallback(async () => {
    try {
      const token = await getSandboxViewerToken(roomName);
      await connect({ token });
    } catch (err) {
      console.log(err);
    }
  }, [connect, getSandboxViewerToken, roomName]);

  useEffect(() => {
    handleConnect();

    return () => {
      disconnect();
    };
  }, [handleConnect, disconnect]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.box}>
        <View style={styles.videoView}>
          <LivestreamViewer style={styles.whepView} />
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
