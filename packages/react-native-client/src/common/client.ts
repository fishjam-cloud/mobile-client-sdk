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
 * @param participantToken
 * @param participantMetadata
 * @param config
 * @category Connection
 */
export async function joinRoom<
  ParticipantMetadata extends GenericMetadata = GenericMetadata,
>(
  url: string,
  participantToken: string,
  participantMetadata: ParticipantMetadata,
  config: ConnectionConfig = {},
) {
  await RNFishjamClientModule.joinRoom(
    url,
    participantToken,
    participantMetadata,
    config,
  );
}
/**
 * @category Connection
 */
export async function leaveRoom() {
  await RNFishjamClientModule.leaveRoom();
}
