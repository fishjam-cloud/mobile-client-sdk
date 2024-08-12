import { Metadata } from '../types';
import RNFishjamClientModule from '../RNFishjamClientModule';

export async function connect(
  url: string,
  peerToken: string,
  peerMetadata: Metadata,
) {
  await RNFishjamClientModule.connect(url, peerToken, peerMetadata);
}

export async function leaveRoom() {
  await RNFishjamClientModule.leaveRoom();
}
