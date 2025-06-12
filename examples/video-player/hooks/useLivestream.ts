import { useState, useEffect, useCallback, useRef } from 'react';
import {
  createWhepClient,
  disconnectWhepClient,
  connectWhepClient,
  useEvent,
} from 'react-native-whip-whep';

export const useLivestream = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);
  const isClientInitialized = useRef(false);

  const connectLivestream = useCallback(async () => {
    try {
      setIsLoading(true);
      setHasErrors(false);

      createWhepClient(process.env.EXPO_PUBLIC_BROADCASTER_URL, {
        authToken: 'example', // Replace with your actual auth token
      });

      await connectWhepClient();
      isClientInitialized.current = true;
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
      if (isClientInitialized.current) {
        disconnectWhepClient();
      }
    };
  }, [connectLivestream]);

  return { isLoading, isReconnecting, hasErrors, restart: connectLivestream };
};
