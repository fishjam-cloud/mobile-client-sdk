import { useCallback } from 'react';
import {
  connectWhipClient,
  createWhipClient,
  disconnectWhipClient,
  cameras,
} from 'react-native-whip-whep';
import { FISHJAM_WHIP_URL } from '../consts';

export interface useLivestreamStreamerResult {
  connect: (token: string, urlOverride?: string) => Promise<void>;
  disconnect: () => void;
}

export const useLivestreamStreamer = (): useLivestreamStreamerResult => {
  const connect = useCallback(async (token: string, urlOverride?: string) => {
    const resolvedUrl = urlOverride ?? FISHJAM_WHIP_URL;
    console.log({ resolvedUrl, token });
    createWhipClient(
      resolvedUrl,
      {
        authToken: token,
      },
      cameras[0].id,
    );
    console.log('running connectWhipClient');
    await connectWhipClient();
  }, []);

  return { connect, disconnect: disconnectWhipClient };
};
