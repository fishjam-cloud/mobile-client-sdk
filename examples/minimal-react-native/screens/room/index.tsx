import { FlatList, ListRenderItemInfo, StyleSheet, View } from 'react-native';
import { RootScreenProps } from '../../navigation/RootNavigation';
import { useConnection, usePeers } from '@fishjam-cloud/react-native-client';
import { parsePeersToTracks } from '../../utils';
import { useCallback, useEffect } from 'react';
import { GridTrack } from '../../types';
import { VideosGridItem } from '../../components/VideosGridItem';

export type RoomScreenProps = RootScreenProps<'Room'>;

const RoomScreen = () => {
  const { leaveRoom } = useConnection();
  const { localPeer, remotePeers } = usePeers();
  const videoTracks = parsePeersToTracks(localPeer, remotePeers);

  const keyExtractor = useCallback((item: GridTrack) => item.peerId, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<GridTrack>) => <VideosGridItem peer={item} />,
    [],
  );

  useEffect(() => {
    return () => {
      leaveRoom();
    };
  }, [leaveRoom]);

  return (
    <View style={styles.container}>
      <FlatList
        data={videoTracks}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={styles.contentContainerStyle}
        columnWrapperStyle={styles.columnWrapperStyle}
      />
    </View>
  );
};

export default RoomScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 32,
  },
  contentContainerStyle: {
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  columnWrapperStyle: {
    gap: 16,
  },
});
