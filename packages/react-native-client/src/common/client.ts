import { Metadata } from '../types';
import RNFishjamClientModule from '../RNFishjamClientModule';

export type ConnectionConfig = {
  /**
   * Configuration for automatic reconnection
   * sdk uses a linear backoff algorithm, that is the formula
   * for the delay of the nth attempt is
   * n * delayMs + initialDelayMs
   *
   * Pass 0 for maxAttempts to disable automatic reconnection
   */
  reconnectConfig?: {
    maxAttempts?: number;
    initialDelayMs?: number;
    delayMs?: number;
  };
};

export async function connect(
  url: string,
  peerToken: string,
  peerMetadata: Metadata,
  config: ConnectionConfig = {},
) {
  await RNFishjamClientModule.connect(url, peerToken, peerMetadata, config);
}

export async function leaveRoom() {
  await RNFishjamClientModule.leaveRoom();
}
