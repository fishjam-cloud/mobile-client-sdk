import { VideoRendererView } from '@fishjam-cloud/react-native-client';
import { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { GridTrack } from '../types';

export const VideosGridItem = ({ peer }: { peer: GridTrack }) => {
  const videoContainer = useMemo(
    () => [
      styles.video,
      {
        backgroundColor: peer.isLocal ? '#606619' : '#7089DB',
      },
    ],
    [peer.isLocal],
  );

  return (
    <View style={styles.container}>
      <View style={videoContainer}>
        {peer.track ? (
          <VideoRendererView
            trackId={peer.track.id}
            videoLayout="FIT"
            style={styles.videoContent}
          />
        ) : (
          <View style={styles.videoContent}>
            <Text>No video</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 0.5,
  },
  video: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    borderColor: '#001A72',
    borderWidth: 1,
  },
  videoContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
