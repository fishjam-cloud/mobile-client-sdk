import { StyleSheet } from 'react-native';
import { RootScreenProps } from '../../navigation/RootNavigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideosGrid } from '../../components/VideosGrid';

export type RoomScreenProps = RootScreenProps<'Room'>;

const RoomScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <VideosGrid />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 32,
    gap: 16,
  },
});

export default RoomScreen;
