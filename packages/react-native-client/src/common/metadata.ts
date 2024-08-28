import { GenericMetadata } from '../types';
import RNFishjamClientModule from '../RNFishjamClientModule';

/**
 * a function that updates endpoints's metadata on the server
 * @param metadata a map `string -> any` containing user's track metadata to be sent to the server
 */
export async function updatePeerMetadata<
  ParticipiantMetadata extends GenericMetadata = GenericMetadata,
>(metadata: ParticipiantMetadata) {
  await RNFishjamClientModule.updatePeerMetadata(metadata);
}
