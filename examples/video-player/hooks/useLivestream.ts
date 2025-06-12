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

  const resolveBroadcasterURLAfterRedirect = async () => {
    const response = await fetch(process.env.EXPO_BROADCASTER_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch broadcaster URL');
    }
    return response.url;
  };

  const connectLivestream = useCallback(async () => {
    try {
      setIsLoading(true);
      setHasErrors(false);

      const response = await fetch(process.env.EXPO_VIEWER_TOKEN_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch auth token');
      }
      const responseJson = await response.json();
      const authToken = responseJson.token;

      if (!authToken) {
        throw new Error('Auth token response invalid');
      }

      const broadcasterURL = `${await resolveBroadcasterURLAfterRedirect()}/api/whep`;

      createWhepClient(broadcasterURL, {
        authToken,
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
