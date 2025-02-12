import { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { VideoRendererView } from '../VideoRendererView';
import { Track } from '../../hooks/usePeers';

export type GridTrack = {
  track: Track | null;
  peerId: string;
  isLocal: boolean;
  isVadActive: boolean;
  aspectRatio: number | null;
};

export const GridTrackItem = ({ peer }: { peer: GridTrack }) => {
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
        {peer.isVadActive && (
          <View style={styles.vadIcon}>
            <Text>{'speaking'}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 10,
  },
  videoContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    flex: 1,
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
