import { useState } from 'react';

import { ReceivableEvents } from '../common/eventEmitter';
import { useFishjamEvent } from './useFishjamEvent';

export type BandwidthEstimationEvent = { BandwidthEstimation: number };

/**
 * This hook provides current bandwidth estimation
 * estimation - client's available incoming bitrate estimated
 * by the server. It's measured in bits per second.
 */
export function useBandwidthEstimation() {
  const [estimation, setEstimation] = useState<BandwidthEstimationEvent | null>(
    null,
  );

  useFishjamEvent<BandwidthEstimationEvent>(
    ReceivableEvents.BandwidthEstimation,
    setEstimation,
  );

  return { estimation: estimation?.BandwidthEstimation };
}
