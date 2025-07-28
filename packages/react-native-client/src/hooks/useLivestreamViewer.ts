import { useCallback } from 'react';
import {
  connectWhepClient,
  createWhepClient,
  disconnectWhepClient,
} from 'react-native-whip-whep';

export interface useLivestreamViewerResult {
  connect: (url: string, token: string) => Promise<void>;
  disconnect: () => void;
}

export const useLivestreamViewer = (): useLivestreamViewerResult => {
  const connect = useCallback(async (url: string, token: string) => {
    createWhepClient(url, {
      authToken: token,
    });
    await connectWhepClient();
  }, []);

  return { connect, disconnect: disconnectWhepClient };
};
