import React, { useCallback } from 'react';
import { FlatList, ListRenderItemInfo, StyleSheet } from 'react-native';

import { GridTrack, GridTrackItem } from './GridTrackItem';
import { parsePeersToTracks } from './parsePeersToTracks';
import { usePeers } from '../../hooks/usePeers';

export const VideosGrid = () => {
  const { localPeer, remotePeers } = usePeers();
  const videoTracks = parsePeersToTracks(localPeer, remotePeers);

  const keyExtractor = useCallback((item: GridTrack) => item.peerId, []);
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<GridTrack>) => <GridTrackItem peer={item} />,
    [],
  );

  return (
    <FlatList<GridTrack>
      data={videoTracks}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentContainerStyle={styles.contentContainerStyle}
    />
  );
};

const styles = StyleSheet.create({
  contentContainerStyle: {
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 40,
  },
});
