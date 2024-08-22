import {
  Track,
  VideoRendererView,
  Metadata,
} from '@fishjam-cloud/react-native-client';
import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { roomScreenLabels } from '../types/ComponentLabels';
import { BrandColors } from '../utils/Colors';

type Props = {
  tracks: Track<Metadata>[];
};

const { VIDEO_CELL } = roomScreenLabels;

export default function VideosGrid({ tracks }: Props) {
  console.log('track', tracks);
  return (
    <FlatList<Track<Metadata>>
      data={tracks}
      renderItem={({ item: track, index: idx }) => (
        <View
          accessibilityLabel={VIDEO_CELL + idx}
          style={styles.video}
          key={idx}>
          <VideoRendererView
            trackId={track.id}
            videoLayout="FIT"
            style={styles.flexOne}
          />
        </View>
      )}
    />
  );
}

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
    backgroundColor: BrandColors.darkBlue60,
    borderColor: BrandColors.darkBlue100,
    borderWidth: 2,
  },
});
