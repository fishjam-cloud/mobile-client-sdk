import React, { useCallback } from 'react';
import { FlatList, ListRenderItemInfo, StyleSheet } from 'react-native';

import { VideosGridItem } from './VideosGridItem';
import { usePeers } from '@fishjam-cloud/react-native-client';
import { parsePeersToTracks } from '../utils';
import { GridTrack } from '../types';

export const VideosGrid = () => {
  const { localPeer, remotePeers } = usePeers();
  const videoTracks = parsePeersToTracks(localPeer, remotePeers);

  const keyExtractor = useCallback((item: GridTrack) => item.peerId, []);
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<GridTrack>) => <VideosGridItem peer={item} />,
    [],
  );

  return (
    <FlatList
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
