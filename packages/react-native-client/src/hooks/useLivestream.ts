import { useEffect } from 'react';
import {
  connectWhepClient,
  createWhepClient,
  disconnectWhepClient,
} from 'react-native-whip-whep';

export interface UseLivestreamResult {
  connect: () => Promise<void>;
  disconnect: () => void;
}

export const useLivestream = (
  url: string,
  token: string,
): UseLivestreamResult => {
  useEffect(() => {
    createWhepClient(url, {
      authToken: token,
    });

    return () => {
      disconnectWhepClient();
    };
  }, [url, token]);

  return { connect: connectWhepClient, disconnect: disconnectWhepClient };
};
