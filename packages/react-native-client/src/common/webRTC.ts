import { TrackEncoding } from '../types';
import RNFishjamClientModule from '../RNFishjamClientModule';
import type { TrackId } from '../hooks/usePeers';

/**
 * Sets track encoding that server should send to the client library.
 *
 * The encoding will be sent whenever it is available. If chooses encoding is
 * temporarily unavailable, some other encoding will be sent until choose encoding
 * becomes active again.
 *
 * @param trackId id of a track which encoding you want to select
 * @param encoding encoding to select
 * @category Debugging
 */
export async function setTargetTrackEncoding(
  trackId: TrackId,
  encoding: TrackEncoding,
) {
  await RNFishjamClientModule.setTargetTrackEncoding(trackId, encoding);
}
