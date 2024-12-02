import { GenericMetadata } from '../types';
import RNFishjamClientModule from '../RNFishjamClientModule';

/**
 * Updates metadata send to other peers
 * @param peerMetadata string indexed record with metadata, that will be available to all other peers
 * @deprecated
 */
export async function updatePeerMetadata<
  PeerMetadata extends GenericMetadata = GenericMetadata,
>(peerMetadata: PeerMetadata) {
  await RNFishjamClientModule.updatePeerMetadata(peerMetadata);
}
