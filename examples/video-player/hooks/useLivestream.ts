import { useState, useEffect, useCallback, useRef } from 'react';
import { WhepClient, useEvent } from 'react-native-whip-whep';

export const useLivestream = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);

  const whepClient = useRef<WhepClient | null>(null);

  const connectLivestream = useCallback(async () => {
    try {
      setIsLoading(true);
      setHasErrors(false);

      whepClient.current = new WhepClient({
        audioEnabled: true,
        videoEnabled: true,
      });

      await whepClient.current?.connect({
        serverUrl: process.env.EXPO_PUBLIC_BROADCASTER_URL,
        authToken: process.env.EXPO_PUBLIC_AUTH_TOKEN,
      });
    } catch (error) {
      console.error(error);
      setHasErrors(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEvent('ReconnectionStatusChanged', (status) => {
    if (status === 'reconnectionStarted') {
      setIsReconnecting(true);
    } else if (status === 'reconnected') {
      setIsReconnecting(false);
    } else if (status === 'reconnectionRetriesLimitReached') {
      setIsReconnecting(false);
      setHasErrors(true);
    }
  });

  useEffect(() => {
    connectLivestream();

    return () => {
      whepClient.current?.disconnect();
    };
  }, [connectLivestream]);

  return { isLoading, isReconnecting, hasErrors, restart: connectLivestream };
};
