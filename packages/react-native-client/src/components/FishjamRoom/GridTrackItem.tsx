import { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { VideoRendererView, Track } from '../../';

export type GridTrack = Track & {
  peerId: string;
  isLocal: boolean;
  isVadActive: boolean;
};

export const GridTrackItem = ({ track }: { track: GridTrack }) => {
  const containerStyle = useMemo(
    () => [
      styles.video,
      {
        backgroundColor: track.isLocal ? '#606619' : '#7089DB',
      },
    ],
    [track.isLocal],
  );

  return (
    <View style={containerStyle}>
      <VideoRendererView
        trackId={track.id}
        videoLayout="FIT"
        style={styles.flexOne}
      />
      {track.isVadActive && (
        <View style={styles.vadIcon}>
          <Text>{'speaking'}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  video: {
    flex: 1,
    margin: 10,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    borderColor: '#001A72',
    borderWidth: 2,
  },
  vadIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    opacity: 0.5,
  },
  userLabel: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    opacity: 0.5,
    backgroundColor: '#F5F7FE',
    borderRadius: 4,
    padding: 3,
  },
});
