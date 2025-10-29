import { useSandbox } from '@fishjam-cloud/react-native-client';
import {
  LivestreamViewer,
  useLivestreamViewer,
} from '@fishjam-cloud/react-native-client/livestream';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
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

  const { connect, disconnect, whepClientRef } = useLivestreamViewer();

  useEffect(() => {
    const connectToStream = async () => {
      try {
        const token = await getSandboxViewerToken(roomName);
        await connect({ token });
      } catch (err) {
        console.error(err);
      }
    };

    connectToStream();

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.box}>
        <View style={styles.videoView}>
          <LivestreamViewer style={styles.whepView} ref={whepClientRef} />
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
