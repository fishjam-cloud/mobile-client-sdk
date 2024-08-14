import { Metadata } from '../types';
import RNFishjamClientModule from '../RNFishjamClientModule';

/**
 * a function that updates endpoints's metadata on the server
 * @param metadata a map `string -> any` containing user's track metadata to be sent to the server
 */
export async function updatePeerMetadata<PeerMetadataType extends Metadata>(
  metadata: PeerMetadataType,
) {
  await RNFishjamClientModule.updatePeerMetadata(metadata);
}

/**
 * a function that updates video metadata on the server.
 * @param metadata a map string -> any containing video track metadata to be sent to the server
 */
export async function updateVideoTrackMetadata<
  VideoTrackMetadataType extends Metadata,
>(metadata: VideoTrackMetadataType) {
  await RNFishjamClientModule.updateVideoTrackMetadata(metadata);
}
