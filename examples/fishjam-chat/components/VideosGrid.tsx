import { Track, VideoRendererView } from '@fishjam-cloud/react-native-client';
import React, { useCallback, useMemo } from 'react';
import { FlatList, ListRenderItemInfo, StyleSheet, View } from 'react-native';
import { PeerWithTracks } from '@fishjam-cloud/react-native-client/build/hooks/usePeers';
import { roomScreenLabels } from '../types/ComponentLabels';
import { BrandColors } from '../utils/Colors';
import Typo from './Typo';
import VADIcon from './VADIcon';
import { PeerMetadata } from '../types/metadata';

type Props = {
  localPeer: PeerWithTracks<PeerMetadata> | null;
  remotePeers: PeerWithTracks<PeerMetadata>[];
};

type GridTrack = Track & {
  peerId: string;
  isLocal: boolean;
  userName: string | undefined;
  isVadActive: boolean;
};

const { VIDEO_CELL } = roomScreenLabels;

export function parsePeersToTracks(
  localPeer: PeerWithTracks<PeerMetadata> | null,
  remotePeers: PeerWithTracks<PeerMetadata>[],
): GridTrack[] {
  const tracks: GridTrack[] = [];
  if (localPeer?.cameraTrack && localPeer.cameraTrack.isActive) {
    tracks.push({
      ...localPeer.cameraTrack!,
      peerId: localPeer.id,
      isLocal: localPeer.isLocal,
      userName: localPeer.metadata.peer.displayName,
      isVadActive: localPeer.microphoneTrack?.vadStatus === 'speech',
    });
  } else if (
    localPeer?.screenShareVideoTrack &&
    localPeer.screenShareVideoTrack.isActive
  ) {
    tracks.push({
      ...localPeer.screenShareVideoTrack,
      peerId: localPeer.id,
      isLocal: localPeer.isLocal,
      userName: localPeer.metadata.peer.displayName,
      isVadActive: localPeer.screenShareAudioTrack?.vadStatus === 'speech',
    });
  }

  remotePeers.forEach((peer) => {
    if (peer.cameraTrack && peer.cameraTrack.isActive) {
      tracks.push({
        ...peer.cameraTrack,
        peerId: peer.id,
        isLocal: peer.isLocal,
        userName: peer.metadata.peer.displayName,
        isVadActive: peer.microphoneTrack?.vadStatus === 'speech',
      });
    } else if (
      peer.screenShareVideoTrack &&
      peer.screenShareVideoTrack.isActive
    ) {
      tracks.push({
        ...peer.screenShareVideoTrack,
        peerId: peer.id,
        isLocal: peer.isLocal,
        userName: peer.metadata.peer.displayName,
        isVadActive: peer.screenShareAudioTrack?.vadStatus === 'speech',
      });
    }
  });

  return tracks;
}

const ListFooterComponent = () => <View style={{ height: 60 }} />;

const GridTrackItem = ({
  track,
  index,
}: {
  track: GridTrack;
  index: number;
}) => {
  const containerStyle = useMemo(
    () => [
      styles.video,
      {
        backgroundColor: track.isLocal
          ? BrandColors.yellow100
          : BrandColors.darkBlue60,
      },
    ],
    [track.isLocal],
  );

  return (
    <View accessibilityLabel={VIDEO_CELL + index} style={containerStyle}>
      <VideoRendererView
        trackId={track.id}
        videoLayout="FIT"
        style={styles.flexOne}
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

export default function VideosGrid({ localPeer, remotePeers }: Props) {
  const videoTracks = parsePeersToTracks(localPeer, remotePeers);

  const keyExtractor = useCallback((item: GridTrack) => item.id, []);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<GridTrack>) => (
      <GridTrackItem track={item} index={index} />
    ),
    [],
  );

  return (
    <FlatList<GridTrack>
      data={videoTracks}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListFooterComponent={ListFooterComponent}
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
