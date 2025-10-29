import React, { useCallback, useEffect, useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import {
  LivestreamViewer,
  useLivestreamViewer,
} from '@fishjam-cloud/react-native-client/livestream';
import { useSandbox } from '@fishjam-cloud/react-native-client';
import { useDeviceOrientation } from '../hooks/useDeviceOrientation';
import { setStatusBarHidden } from 'expo-status-bar';
import { setVisibilityAsync } from 'expo-navigation-bar';

interface FishjamPlayerProps {
  roomName: string;
  pictureInPicture?: boolean;
}

const PIP_SIZE = {
  width: 1920,
  height: 1080,
};

const FishjamPlayer = ({
  roomName,
  pictureInPicture = true,
}: FishjamPlayerProps) => {
  const { isLandscape } = useDeviceOrientation();
  const styles = useMemo(() => createStyles(isLandscape), [isLandscape]);
  const { getSandboxViewerToken } = useSandbox({
    fishjamId: process.env.EXPO_PUBLIC_FISHJAM_ID,
  });

  const { connect, disconnect, whepClientRef } = useLivestreamViewer();

  const handleConnect = useCallback(async () => {
    try {
      const token = await getSandboxViewerToken(roomName);
      await connect({ token });
    } catch (err) {
      console.error(err);
    }
  }, [connect, getSandboxViewerToken, roomName]);

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
    <View style={styles.playerContentContainer}>
      <View style={styles.playerWhepView}>
        <LivestreamViewer
          style={styles.playerWhepClientView}
          pipEnabled={pictureInPicture}
          autoStartPip={pictureInPicture}
          autoStopPip={pictureInPicture}
          pipSize={PIP_SIZE}
          ref={whepClientRef}
        />
      </View>
    </View>
  );
};

export default FishjamPlayer;

const createStyles = (isLandscape: boolean) =>
  StyleSheet.create({
    playerWhepClientView: {
      flex: 1,
    },
    playerContentContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    playerWhepView: {
      width: '100%',
      height: isLandscape ? '100%' : undefined,
      aspectRatio: isLandscape ? undefined : 16 / 9,
      backgroundColor: 'black',
    },
    playerLoader: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
