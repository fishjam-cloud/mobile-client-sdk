import { GenericMetadata } from '../types';
import RNFishjamClientModule from '../RNFishjamClientModule';

/**
 * Updates metadata send to other participants
 * @param participantMetadata string indexed record with metadata, that will be available to all other participants
 * @category Connection
 */
export async function updatePeerMetadata<
  ParticipantMetadata extends GenericMetadata = GenericMetadata,
>(participantMetadata: ParticipantMetadata) {
  await RNFishjamClientModule.updatePeerMetadata(participantMetadata);
}
