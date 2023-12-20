import React, {useCallback, useEffect, useState} from 'react';
import {BackHandler, SafeAreaView, StyleSheet, View} from 'react-native';
import {InCallButton, VideosGrid} from '../components';
import {Stats} from '../components/Stats';
import {NoCameraView} from '../components/NoCameraView';

import {
  useCamera,
  useMicrophone,
  useJellyfishClient,
  usePeers,
  useScreencast,
  useRTCStatistics,
} from '@jellyfish-dev/react-native-client-sdk';

import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AppRootStackParamList} from '../navigators/AppNavigator';

import {roomScreenLabels} from '../types/ComponentLabels';

type Props = NativeStackScreenProps<AppRootStackParamList, 'Room'>;
const {
  DISCONNECT_BUTTON,
  TOGGLE_CAMERA_BUTTON,
  SWITCH_CAMERA_BUTTON,
  SHARE_SCREEN_BUTTON,
  TOGGLE_MICROPHONE_BUTTON,
  TOGGLE_STATISTICS_BUTTON,
  NO_CAMERA_VIEW,
  AUDIO_STATISTICS_RTC,
  VIDEO_STATISTICS_RTC,
} = roomScreenLabels;

const RoomScreen = ({navigation}: Props) => {
  const peers = usePeers();
  const {leave} = useJellyfishClient();
  const {isCameraOn, flipCamera, toggleCamera} = useCamera();
  const {isScreencastOn, toggleScreencast} = useScreencast();
  const {isMicrophoneOn, toggleMicrophone} = useMicrophone();
  const [showStats, setShowStats] = useState(false);
  const {statistics} = useRTCStatistics(1000);
  const [labels, setLabels] = useState<string[]>([]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true,
    );
    return () => backHandler.remove();
  }, []);

  const getListOfPlotNames = useCallback(() => {
    if (statistics.length > 0 && showStats) {
      setLabels(Object.keys(statistics[statistics.length - 1] || []));
    }
  }, [statistics, showStats]);

  useEffect(() => {
    getListOfPlotNames();
  }, [getListOfPlotNames, statistics]);

  const toggleStatistics = () => {
    setShowStats(!showStats);
  };

  const onDisconnectPress = useCallback(() => {
    leave();
    navigation.navigate('Connect');
  }, [navigation, leave]);

  return (
    <SafeAreaView style={styles.container}>
      {labels.length > 0 && showStats && (
        <>
          {labels.sort().map((name, id) => {
            return (
              <View key={id}>
                <Stats
                  stats={statistics}
                  label={name}
                  accessibilityLabel={
                    name.replace(/_.*$/, '') === 'RTCOutboundRTPAudioStream'
                      ? VIDEO_STATISTICS_RTC
                      : AUDIO_STATISTICS_RTC
                  }
                />
              </View>
            );
          })}
        </>
      )}
      {isCameraOn ? (
        <VideosGrid
          tracks={
            peers
              .flatMap(peer =>
                peer.tracks
                  .filter(t => t.metadata.type !== 'audio')
                  .map(t => t.id),
              )
              .filter(t => t) as string[]
          }
        />
      ) : (
        <NoCameraView username="username" accessibilityLabel={NO_CAMERA_VIEW} />
      )}

      <View style={styles.callView}>
        <InCallButton
          type="disconnect"
          iconName="phone-hangup"
          onPress={onDisconnectPress}
          accessibilityLabel={DISCONNECT_BUTTON}
        />
        <InCallButton
          iconName={isMicrophoneOn ? 'microphone-off' : 'microphone'}
          onPress={toggleMicrophone}
          accessibilityLabel={TOGGLE_MICROPHONE_BUTTON}
        />
        <InCallButton
          iconName={isCameraOn ? 'camera-off' : 'camera'}
          onPress={toggleCamera}
          accessibilityLabel={TOGGLE_CAMERA_BUTTON}
        />
        <InCallButton
          iconName="camera-switch"
          onPress={flipCamera}
          accessibilityLabel={SWITCH_CAMERA_BUTTON}
        />
        <InCallButton
          iconName="chart-bar"
          onPress={toggleStatistics}
          accessibilityLabel={TOGGLE_STATISTICS_BUTTON}
        />
        <InCallButton
          iconName={isScreencastOn ? 'share-off' : 'share'}
          onPress={() =>
            toggleScreencast({
              screencastMetadata: {displayName: 'Mobile phone'},
            })
          }
          accessibilityLabel={SHARE_SCREEN_BUTTON}
        />
      </View>
    </SafeAreaView>
  );
};

export default RoomScreen;

const styles = StyleSheet.create({
  callView: {display: 'flex', flexDirection: 'row', gap: 10},
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1FAFE',
    padding: 24,
  },
});
