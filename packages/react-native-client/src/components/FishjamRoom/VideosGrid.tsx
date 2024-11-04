import React, { useCallback } from 'react';
import { FlatList, ListRenderItemInfo, StyleSheet } from 'react-native';

import { GridTrack, GridTrackItem } from './GridTrackItem';
import { parsePeersToTracks } from './parsePeersToTracks';
import { usePeers } from '../..';

export const VideosGrid = () => {
  const { localPeer, remotePeers } = usePeers();
  const videoTracks = parsePeersToTracks(localPeer, remotePeers);

  const keyExtractor = useCallback((item: GridTrack) => item.id, []);
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<GridTrack>) => <GridTrackItem track={item} />,
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
    flexGrow: 1,
  },
});
