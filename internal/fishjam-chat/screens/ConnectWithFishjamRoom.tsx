import { FishjamRoom, useSandbox } from '@fishjam-cloud/react-native-client';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

export const ConnectWithFishjamRoom = () => {
  const fishjamId = process.env.EXPO_PUBLIC_FISHJAM_ID ?? '';
  const { getSandboxPeerToken } = useSandbox({ fishjamId: fishjamId });
  const [peerToken, setPeerToken] = useState<string | null>(null);

  const uniqPeerName = `test-user-${new Date().getTime()}${Math.random()*1000}`;

  useEffect(() => {
    const connect = async () => {
      try {

        const peerToken = await getSandboxPeerToken('test-room', uniqPeerName);
        setPeerToken(peerToken);
      } catch (e) {
        console.error('Error connecting to Fishjam', e);
      }
    };

    connect();
  }, []);

  if (!peerToken) {
    return <ActivityIndicator size="large" style={styles.indicator} />;
  }

  return (
    <FishjamRoom fishjamId={fishjamId} peerToken={peerToken} />
  );
};

const styles = StyleSheet.create({
  indicator: {
    flex: 1,
  },
});
