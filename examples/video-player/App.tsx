import { StyleSheet, View, Platform } from 'react-native';
import { useCallback, useEffect } from 'react';
import { setStatusBarHidden } from 'expo-status-bar';
import { setVisibilityAsync } from 'expo-navigation-bar';
import { useDeviceOrientation } from './hooks/useDeviceOrientation';
import FishjamPlayer from './components/FishjamPlayer';
import { useSandbox } from '@fishjam-cloud/react-native-client';
import { useLivestreamViewer } from '@fishjam-cloud/react-native-client/livestream';

const roomName = 'test';

const App = () => {
  const { isLandscape } = useDeviceOrientation();
  const { getSandboxViewerToken } = useSandbox({
    fishjamId: process.env.EXPO_PUBLIC_FISHJAM_ID,
  });

  const { connect, disconnect } = useLivestreamViewer();

  const handleConnect = useCallback(async () => {
    try {
      const token = await getSandboxViewerToken(roomName);
      await connect({ token });
    } catch (err) {
      console.error(err);
    }
  }, [connect, getSandboxViewerToken]);

  useEffect(() => {
    handleConnect();

    return () => {
      disconnect();
    };
  }, [handleConnect, disconnect]);

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
      <FishjamPlayer isLandscape={isLandscape} />
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  videoContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'black',
  },
});
