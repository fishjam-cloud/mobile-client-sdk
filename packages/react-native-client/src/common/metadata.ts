import { GenericMetadata } from '../types';
import RNFishjamClientModule from '../RNFishjamClientModule';

/**
 * a function that updates endpoints's metadata on the server
 * @param metadata a map indexed by strings, containing participants metadata to be sent to the server
 */
export async function updatePeerMetadata<
  ParticipantMetadata extends GenericMetadata = GenericMetadata,
>(metadata: ParticipantMetadata) {
  await RNFishjamClientModule.updatePeerMetadata(metadata);
}
