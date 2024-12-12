import { ReceivableEvents } from '../RNFishjamClientModule';
import { useFishjamEventState } from './internal/useFishjamEventState';

/**
 * This hook provides current bandwidth estimation
 * estimation - client's available incoming bitrate estimated
 * by the server. It's measured in bits per second.
 * @category Debugging
 * @group Hooks
 */
export function useBandwidthEstimation() {
  const estimation = useFishjamEventState<number | null>(
    ReceivableEvents.BandwidthEstimation,
    null,
  );
  return {
    /**
     * Bandwidth estimation, measured in bits per second
     */
    estimation,
  };
}
