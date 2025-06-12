import { StyleSheet, View } from 'react-native';
import { useLivestream } from '../hooks/useLivestream';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMemo } from 'react';
import FishjamPlayer from '../components/FishjamPlayer';
import { useDeviceOrientation } from '../hooks/useDeviceOrientation';

const VideoPlayerScreen = () => {
  const insets = useSafeAreaInsets();
  const { isLandscape } = useDeviceOrientation();
  const { isReconnecting, hasErrors, restart } = useLivestream();

  const styles = useMemo(() => createStyles(isLandscape), [isLandscape]);

  return (
    <View
      style={[
        styles.videoWrapper,
        {
          paddingTop: isLandscape ? 0 : insets.top,
        },
      ]}>
      <View style={styles.videoContainer}>
        <FishjamPlayer
          isLandscape={isLandscape}
          hasErrors={hasErrors}
          restart={restart}
          isReconnecting={isReconnecting}
        />
      </View>
    </View>
  );
};

export default VideoPlayerScreen;

const createStyles = (isLandscape: boolean) =>
  StyleSheet.create({
    videoWrapper: {
      backgroundColor: 'black',
      flex: isLandscape ? 1 : 0,
    },
    videoContainer: {
      flex: 1,
      position: 'relative',
    },
  });
