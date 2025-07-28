import { useCallback, useRef } from 'react';
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
  const isWhipClientCreatedRef = useRef(false);

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
    isWhipClientCreatedRef.current = true;
    await connectWhipClient();
  }, []);

  const disconnect = useCallback(() => {
    // TODO: Remove when FCE-1786 fixed
    if (isWhipClientCreatedRef.current) {
      disconnectWhipClient();
    }
  }, []);

  return { connect, disconnect };
};
