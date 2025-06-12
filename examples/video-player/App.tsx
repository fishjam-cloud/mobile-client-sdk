import { StyleSheet, View, Platform } from 'react-native';
import { useEffect } from 'react';
import { setStatusBarHidden } from 'expo-status-bar';
import { setVisibilityAsync } from 'expo-navigation-bar';
import { useLivestream } from './hooks/useLivestream';
import { useDeviceOrientation } from './hooks/useDeviceOrientation';
import FishjamPlayer from './components/FishjamPlayer';

const VideoPlayerScreen = () => {
  const { isLandscape } = useDeviceOrientation();
  const { isReconnecting, hasErrors, restart } = useLivestream();

  useEffect(() => {
    setStatusBarHidden(isLandscape, 'fade');
    if (Platform.OS === 'android') {
      setVisibilityAsync(isLandscape ? 'hidden' : 'visible');
    }

    return () => {
      setStatusBarHidden(false, 'fade');
      if (Platform.OS === 'android') {
        setVisibilityAsync('visible');
      }
    };
  }, [isLandscape]);

  return (
    <View style={styles.videoContainer}>
      <FishjamPlayer
        isLandscape={isLandscape}
        hasErrors={hasErrors}
        restart={restart}
        isReconnecting={isReconnecting}
      />
    </View>
  );
};

export default VideoPlayerScreen;

const styles = StyleSheet.create({
  videoContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'black',
  },
});
