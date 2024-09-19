import { TrackEncoding } from '../types';
import RNFishjamClientModule from '../RNFishjamClientModule';

export type LoggingSeverity = 'verbose' | 'info' | 'warning' | 'error' | 'none';

/**
 * sets track encoding that server should send to the client library.
 * The encoding will be sent whenever it is available. If chooses encoding is
 * temporarily unavailable, some other encoding will be sent until choose encoding
 *  becomes active again.
 *
 * @param trackId id of a track which encoding you want to select
 * @param encoding encoding to select
 * @category Debugging
 */
export async function setTargetTrackEncoding(
  trackId: string,
  encoding: TrackEncoding,
) {
  await RNFishjamClientModule.setTargetTrackEncoding(trackId, encoding);
}

/**
 * Function that changes level of debugging logs in WebRTC.
 * @param severity to use when displaying logs
 * @returns a promise that is resolved when debug severity is changed
 * @category Debugging
 */
export function changeWebRTCLoggingSeverity(
  severity: LoggingSeverity,
): Promise<void> {
  return RNFishjamClientModule.changeWebRTCLoggingSeverity(severity);
}
