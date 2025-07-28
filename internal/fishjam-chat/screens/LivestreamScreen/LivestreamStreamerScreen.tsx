import {
  LivestreamStreamer,
  useLivestreamStreamer,
  useSandbox,
} from '@fishjam-cloud/react-native-client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { AppRootStackParamList } from '../../navigators/AppNavigator';
import { BrandColors } from '../../utils/Colors';

type Props = NativeStackScreenProps<
  AppRootStackParamList,
  'LivestreamStreamerScreen'
>;

export default function LivestreamStreamerScreen({ route }: Props) {
  // const { livestreamUrl, viewerToken } = route.params;

  const { getSandboxLivestream } = useSandbox({
    fishjamId: 'f9f9d5322e98411ca6238efeb551cdb8',
  });

  const { connect, disconnect } = useLivestreamStreamer();

  const handleConnect = useCallback(async () => {
    try {
      const { streamerToken } = await getSandboxLivestream('test-room1', true);
      console.log('connecteting');
      await connect(streamerToken);
    } catch (err) {
      console.log(err);
    }
  }, [connect, getSandboxLivestream]);

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
          <LivestreamStreamer style={styles.whepView} />
          {/* <LivestreamViewer style={styles.whepView} /> */}
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
  pausedVideo: {
    flex: 1,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectedText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pausedText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
});
