import React, { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  LivestreamStreamer,
  useLivestreamStreamer,
  cameras,
  VideoParameters,
} from '@fishjam-cloud/react-native-client/livestream';
import { useSandbox } from '@fishjam-cloud/react-native-client';

interface FishjamPlayerStreamerProps {
  roomName: string;
}

const FishjamPlayerStreamer = ({ roomName }: FishjamPlayerStreamerProps) => {
  const { getSandboxLivestream } = useSandbox({
    fishjamId: process.env.EXPO_PUBLIC_FISHJAM_ID,
  });

  const { connect, disconnect, whipClientRef } = useLivestreamStreamer({
    videoEnabled: true,
    audioEnabled: true,
    camera: cameras[0],
    videoParameters: VideoParameters.presetHD169,
  });

  const handleConnect = useCallback(async () => {
    try {
      const { streamerToken } = await getSandboxLivestream(roomName, false);
      await connect(streamerToken);
    } catch (err) {
      console.error(err);
    }
  }, [connect, getSandboxLivestream, roomName]);

  useEffect(() => {
    handleConnect();

    return () => {
      disconnect();
    };
  }, [handleConnect, disconnect]);

  return (
    <View style={styles.playerContentContainer}>
      <LivestreamStreamer
        style={{ height: '90%', aspectRatio: 16 / 9 }}
        ref={whipClientRef}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  playerContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FishjamPlayerStreamer;
