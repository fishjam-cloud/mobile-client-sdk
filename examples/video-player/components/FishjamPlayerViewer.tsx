import React, { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  LivestreamViewer,
  useLivestreamViewer,
} from '@fishjam-cloud/react-native-client/livestream';
import { useSandbox } from '@fishjam-cloud/react-native-client';

interface FishjamPlayerViewerProps {
  roomName: string;
  pictureInPicture?: boolean;
}

const FishjamPlayerViewer = ({
  roomName,
  pictureInPicture = true,
}: FishjamPlayerViewerProps) => {
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

  return (
    <View style={styles.playerContentContainer}>
      <LivestreamViewer
        style={{ height: '90%', aspectRatio: 16 / 9 }}
        pipEnabled={pictureInPicture}
        autoStartPip={pictureInPicture}
        autoStopPip={pictureInPicture}
        pipSize={{ width: 1920, height: 1080 }}
        ref={whepClientRef}
      />
    </View>
  );
};

export default FishjamPlayerViewer;

  const styles = StyleSheet.create({
    playerContentContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    }
  });
