import {
  Track,
  VideoRendererView,
  Participant,
} from '@fishjam-cloud/react-native-client';
import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { roomScreenLabels } from '../types/ComponentLabels';
import { BrandColors } from '../utils/Colors';
import Typo from './Typo';
import { ParticipantMetadata } from '../types/metadata';

type Props = {
  tracks: GridTrack[];
};

type GridTrack = Track & {
  isLocal: boolean;
  userName: string | undefined;
};

const { VIDEO_CELL } = roomScreenLabels;

export function parseParticipantsToTracks(
  participants: Participant<ParticipantMetadata>[],
): GridTrack[] {
  return participants
    .sort((participant) => (participant.isLocal ? -1 : 1))
    .flatMap((participant) =>
      participant.tracks
        .map((track) => ({
          ...track,
          isLocal: participant.isLocal,
          userName: participant.metadata?.name,
        }))
        .filter((track) => track.type === 'Video' && track.isActive),
    );
}

export default function VideosGrid({ tracks }: Props) {
  return (
    <FlatList<GridTrack>
      data={tracks}
      renderItem={({ item: track, index: idx }) => (
        <View
          accessibilityLabel={VIDEO_CELL + idx}
          style={[
            styles.video,
            {
              backgroundColor: track.isLocal
                ? BrandColors.yellow100
                : BrandColors.darkBlue60,
            },
          ]}
          key={idx}>
          <VideoRendererView
            trackId={track.id}
            videoLayout="FIT"
            style={styles.flexOne}
          />
          <View style={styles.userLabel}>
            <Typo variant="chat-regular">{track.userName}</Typo>
          </View>
        </View>
      )}
      ListFooterComponent={() => <View style={{ height: 60 }} />}
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
    borderColor: BrandColors.darkBlue100,
    borderWidth: 2,
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
