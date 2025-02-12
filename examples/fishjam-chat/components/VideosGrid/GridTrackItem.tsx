import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { roomScreenLabels } from '../../types/ComponentLabels';
import { BrandColors } from '../../utils/Colors';
import {
  VideoRendererView,
  Track,
  PeerId,
} from '@fishjam-cloud/react-native-client';
import Typo from '../Typo';
import VADIcon from '../VADIcon';

export type GridTrack = Track & {
  peerId: PeerId;
  isLocal: boolean;
  userName: string | undefined;
  isVadActive: boolean;
  aspectRatio: number;
};

export const GridTrackItem = ({
  track,
  index,
}: {
  track: GridTrack;
  index: number;
}) => {
  const videoStyle = useMemo(
    () => [
      styles.video,
      {
        aspectRatio: track.aspectRatio,
        backgroundColor: track.isLocal
          ? BrandColors.yellow100
          : BrandColors.darkBlue60,
      },
    ],
    [track.aspectRatio, track.isLocal],
  );

  return (
    <View
      accessibilityLabel={roomScreenLabels.VIDEO_CELL + index}
      style={styles.container}>
      <VideoRendererView
        trackId={track.id}
        videoLayout="FILL"
        skipRenderOutsideVisibleArea={false}
        style={videoStyle}
      />
      {track.isVadActive && (
        <View style={styles.vadIcon}>
          <VADIcon />
        </View>
      )}
      <View style={styles.userLabel}>
        <Typo variant="chat-regular">{track.userName}</Typo>
      </View>
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
    padding: 10,
  },
  video: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    borderColor: BrandColors.darkBlue100,
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
    backgroundColor: BrandColors.darkBlue20,
    borderRadius: 4,
    padding: 3,
  },
});
