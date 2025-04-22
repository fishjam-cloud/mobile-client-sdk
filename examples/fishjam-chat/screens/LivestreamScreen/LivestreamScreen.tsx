import { useLivestream } from '@fishjam-cloud/react-native-client';
import {
  connectWhepClient,
  createWhepClient,
  disconnectWhepClient,
  WhepClientView,
} from 'react-native-whip-whep';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Button,
  PermissionsAndroid,
} from 'react-native';

import { AppRootStackParamList } from '../../navigators/AppNavigator';
import { BrandColors } from '../../utils/Colors';

type Props = NativeStackScreenProps<AppRootStackParamList, 'LivestreamScreen'>;

export default function LivestreamScreen({ route }: Props) {
  const { livestreamUrl, viewerToken } = route.params;

  //   const { connect, disconnect } = useLivestream(livestreamUrl, viewerToken);

  const handleConnect = useCallback(async () => {
    try {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);

      createWhepClient(livestreamUrl, {
        authToken: viewerToken,
      });
      await connectWhepClient();
    } catch (err) {
      console.log(err);
    }
  }, [livestreamUrl, viewerToken]);

  useEffect(() => {
    handleConnect();

    return () => {
      //   disconnectWhepClient();
    };
  }, [handleConnect]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.box}>
        <View style={styles.videoView}>
          <WhepClientView style={styles.whepView} />
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
