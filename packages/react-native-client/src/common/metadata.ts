import { GenericMetadata } from '../types';
import RNFishjamClientModule from '../RNFishjamClientModule';

/**
 * a function that updates endpoints's metadata on the server
 * @param metadata a map indexed by strings, containing participiants metadata to be sent to the server
 */
export async function updatePeerMetadata<
  ParticipiantMetadata extends GenericMetadata = GenericMetadata,
>(metadata: ParticipiantMetadata) {
  await RNFishjamClientModule.updatePeerMetadata(metadata);
}
