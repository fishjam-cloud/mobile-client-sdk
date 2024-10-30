import { PeerWithTracks } from '@fishjam-cloud/react-native-client/build/hooks/usePeers';
import React, { useCallback } from 'react';
import { FlatList, ListRenderItemInfo, View } from 'react-native';
import { PeerMetadata } from '../../types/metadata';
import { GridTrack, GridTrackItem } from './GridTrackItem';
import { parsePeersToTracks } from './parsePeersToTracks';

const ListFooterComponent = () => <View style={{ height: 60 }} />;

export default function VideosGrid({
  localPeer,
  remotePeers,
}: {
  localPeer: PeerWithTracks<PeerMetadata> | null;
  remotePeers: PeerWithTracks<PeerMetadata>[];
}) {
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
