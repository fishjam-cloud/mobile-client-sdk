import { VideoRendererView } from '@fishjam-cloud/react-native-client';
import { View, StyleSheet, Text } from 'react-native';
import { GridTrack } from '../types';

export const VideosGridItem = ({ peer }: { peer: GridTrack }) => {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.video,
          { backgroundColor: peer.isLocal ? '#606619' : '#7089DB' },
        ]}>
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
});
