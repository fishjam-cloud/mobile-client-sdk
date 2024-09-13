import { useState } from 'react';

import { ReceivableEvents, useFishjamEvent } from './useFishjamEvent';

/**
 * This hook provides current bandwidth estimation
 * estimation - client's available incoming bitrate estimated
 * by the server. It's measured in bits per second.
 */
export function useBandwidthEstimation() {
  const [estimation, setEstimation] = useState<number | null>(null);

  useFishjamEvent(ReceivableEvents.BandwidthEstimation, setEstimation);

  return { estimation };
}
