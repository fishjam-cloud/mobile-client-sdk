import { GenericMetadata } from '../types';
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

/**
 * @param url fishjam Url
 * @param peerToken token received from server (or Room Manager)
 * @param peerMetadata string indexed record with metadata, that will be available to all other peers
 * @param config additional connection configuration
 */
export async function joinRoom<
  PeerMetadata extends GenericMetadata = GenericMetadata,
>(
  url: string,
  peerToken: string,
  peerMetadata?: PeerMetadata,
  config?: ConnectionConfig,
) {
  await RNFishjamClientModule.joinRoom(
    url,
    peerToken,
    peerMetadata ?? {},
    config ?? {},
  );
}

export async function leaveRoom() {
  await RNFishjamClientModule.leaveRoom();
}
