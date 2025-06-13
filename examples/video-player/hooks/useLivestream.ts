import { useState, useEffect, useCallback } from 'react';
import {
  createWhepClient,
  disconnectWhepClient,
  connectWhepClient,
  useEvent,
} from 'react-native-whip-whep';

// This is a demo token and will only work with the example URL.
// In a production environment, you should obtain the token dynamically.
// For more information, see: https://docs.fishjam.io/livestreaming#viewers
const authToken = 'example';

export const useLivestream = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);

  const connectLivestream = useCallback(async () => {
    try {
      setIsLoading(true);
      setHasErrors(false);

      createWhepClient(process.env.EXPO_PUBLIC_BROADCASTER_URL, {
        authToken,
      });

      await connectWhepClient();
    } catch (error) {
      console.log(error);
      setHasErrors(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEvent('reconnectionStatusChanged', (event) => {
    if (event.status === 'reconnectionStarted') {
      setIsReconnecting(true);
    } else if (event.status === 'reconnected') {
      setIsReconnecting(false);
    } else if (event.status === 'reconnectionRetriesLimitReached') {
      setIsReconnecting(false);
      setHasErrors(true);
    }
  });

  useEffect(() => {
    connectLivestream();

    return () => {
      disconnectWhepClient();
    };
  }, [connectLivestream]);

  return { isLoading, isReconnecting, hasErrors, restart: connectLivestream };
};
