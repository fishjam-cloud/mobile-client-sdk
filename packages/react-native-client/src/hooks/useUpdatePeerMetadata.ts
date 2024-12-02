import { useCallback } from 'react';
import RNFishjamClientModule from '../RNFishjamClientModule';
import { GenericMetadata } from '../types';

/**
 * This hook provides method to update peer metadata
 * @category Connection
 * @group Hooks
 */
export const useUpdatePeerMetadata = <
  PeerMetadata extends GenericMetadata = GenericMetadata,
>() => {
  const updatePeerMetadata = useCallback(async (peerMetadata: PeerMetadata) => {
    await RNFishjamClientModule.updatePeerMetadata(peerMetadata);
  }, []);

  return {
    /**
     * Updates metadata send to other peers
     * @param peerMetadata string indexed record with metadata, that will be available to all other peers
     * @category Connection
     */
    updatePeerMetadata,
  };
};
