import RNFishjamClientModule from '../../RNFishjamClientModule';

export type LoggingSeverity = 'verbose' | 'info' | 'warning' | 'error' | 'none';

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
