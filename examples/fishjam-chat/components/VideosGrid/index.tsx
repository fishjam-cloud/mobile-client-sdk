import { PeerWithTracks } from '@fishjam-cloud/react-native-client/build/hooks/usePeers';
import React, { useCallback, useMemo } from 'react';
import { FlatList, ListRenderItemInfo, StyleSheet, View } from 'react-native';
import { roomScreenLabels } from '../../types/ComponentLabels';
import { PeerMetadata } from '../../types/metadata';
import NoCameraView from '../NoCameraView';
import { GridTrack, GridTrackItem } from './GridTrackItem';
import { parsePeersToTracks } from './parsePeersToTracks';

const ListFooterComponent = () => <View style={{ height: 60 }} />;

export default function VideosGrid({
  localPeer,
  remotePeers,
  username,
}: {
  localPeer: PeerWithTracks<PeerMetadata> | null;
  remotePeers: PeerWithTracks<PeerMetadata>[];
  username: string;
}) {
  const videoTracks = parsePeersToTracks(localPeer, remotePeers);

  const keyExtractor = useCallback((item: GridTrack) => item.id, []);
  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<GridTrack>) => (
      <GridTrackItem track={item} index={index} />
    ),
    [],
  );

  const ListEmptyComponent = useMemo(
    () => (
      <NoCameraView
        username={username}
        accessibilityLabel={roomScreenLabels.NO_CAMERA_VIEW}
      />
    ),
    [username],
  );

  return (
    <FlatList<GridTrack>
      data={videoTracks}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentContainerStyle={styles.contentContainerStyle}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
    />
  );
}

const styles = StyleSheet.create({
  contentContainerStyle: {
    flexGrow: 1,
  },
});
