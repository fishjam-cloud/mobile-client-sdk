import { useCallback } from 'react';
import {
  connectWhipClient,
  createWhipClient,
  disconnectWhipClient,
} from 'react-native-whip-whep';

export interface useLivestreamStreamerResult {
  connect: (url: string, token: string) => Promise<void>;
  disconnect: () => void;
}

export const useLivestreamStreamer = (): useLivestreamStreamerResult => {
  const connect = useCallback(async (url: string, token: string) => {
    createWhipClient(url, {
      authToken: token,
    });
    await connectWhipClient();
  }, []);

  return { connect, disconnect: disconnectWhipClient };
};
