import {
  Track,
  VideoRendererView,
  Peer,
  TrackType,
} from '@fishjam-cloud/react-native-client';
import React, { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { roomScreenLabels } from '../types/ComponentLabels';
import { BrandColors } from '../utils/Colors';
import Typo from './Typo';
import { PeerMetadata } from '../types/metadata';
import VADIcon from './VADIcon';
import { AudioTrack } from '@fishjam-cloud/react-native-client/build/hooks/usePeers';

type Props = {
  videoTracks: GridTrack[];
  audioTracks: GridTrack[];
};

type GridTrack = Track & {
  peerId: string;
  isLocal: boolean;
  userName: string | undefined;
};

const { VIDEO_CELL } = roomScreenLabels;

export function parsePeersToTracks(
  peers: Peer<PeerMetadata>[],
  trackType: TrackType,
): GridTrack[] {
  return peers
    .sort((peer) => (peer.isLocal ? -1 : 1))
    .flatMap((peer) =>
      peer.tracks
        .map((track) => ({
          ...track,
          peerId: peer.id,
          isLocal: peer.isLocal,
          userName: peer.metadata?.displayName,
        }))
        .filter((track) => track.type === trackType && track.isActive),
    );
}

export default function VideosGrid({ videoTracks, audioTracks }: Props) {
  const vadActive = useCallback(
    (track: GridTrack): boolean => {
      return audioTracks.some(
        (audioTrack) =>
          audioTrack.peerId === track.peerId &&
          (audioTrack as AudioTrack).vadStatus === 'speech',
      );
    },
    [audioTracks],
  );

  return (
    <FlatList<GridTrack>
      data={videoTracks}
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
          {vadActive(track) && (
            <View style={styles.vadIcon}>
              <VADIcon />
            </View>
          )}
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
