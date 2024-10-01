import { useCallback, useEffect, useState } from 'react';

import { GenericMetadata, TrackEncoding, TrackMetadata } from '../types';
import RNFishjamClientModule from '../RNFishjamClientModule';
import { ReceivableEvents, useFishjamEvent } from './useFishjamEvent';

export type TrackType = 'Audio' | 'Video';

/**
 * Type describing Voice Activity Detection statuses.
 *
 * speech - voice activity has been detected
 * silence - lack of voice activity has been detected
 */
export type VadStatus = 'silence' | 'speech';

type TrackBase = {
  id: string;
  type: TrackType;
  isActive: boolean;
};

export type AudioTrack = TrackBase & {
  type: 'Audio';
  vadStatus: VadStatus | undefined;
};

export type VideoTrack = TrackBase & {
  type: 'Video';
  // Encoding that is currently received. Only present for remote tracks.
  encoding: TrackEncoding | null;
  // The reason of currently selected encoding. Only present for remote tracks.
  encodingReason: EncodingReason | null;
};

export type Track = VideoTrack | AudioTrack;
/**
 * Type describing possible reasons of currently selected encoding.
 *
 * - other - the exact reason couldn't be determined
 * - encoding_inactive - previously selected encoding became inactive
 * - low_bandwidth - there is no longer enough bandwidth to maintain previously selected encoding
 */
export type EncodingReason = 'other' | 'encoding_inactive' | 'low_bandwidth';

export type Peer<PeerMetadata extends GenericMetadata = GenericMetadata> = {
  /**
   *  id used to identify a peer
   */
  id: string;
  /**
   * whether the peer is local or remote
   */
  isLocal: boolean;
  /**
   * a map indexed by strings, containing peer metadata from the server
   */
  metadata: PeerMetadata;
  /**
   * a list of peer's video and audio tracks
   */
  tracks: Track[];
};

function addIsActiveToTracks<
  PeerMetadata extends GenericMetadata = GenericMetadata,
>(peers: ReadonlyArray<Peer<PeerMetadata>>): Peer<PeerMetadata>[] {
  return peers.map((peer) => ({
    ...peer,
    tracks: peer.tracks.map((track) => ({
      ...track,
      isActive:
        (track as { metadata?: TrackMetadata })?.metadata?.active ?? true,
    })),
  }));
}
/**
 * This hook provides live updates of room peers.
 * @returns An array of room peers.
 * @category Connection
 * @group Hooks
 */
export function usePeers<
  PeerMetadata extends GenericMetadata = GenericMetadata,
>() {
  const [peers, setPeers] = useState<Peer<PeerMetadata>[]>([]);

  const updateActivePeers = useCallback((peers: Peer<PeerMetadata>[]) => {
    setPeers(addIsActiveToTracks<PeerMetadata>(peers));
  }, []);

  useFishjamEvent(ReceivableEvents.PeersUpdate, updateActivePeers);

  useEffect(() => {
    async function updatePeers() {
      const peers = await RNFishjamClientModule.getPeers<PeerMetadata>();
      setPeers(addIsActiveToTracks<PeerMetadata>(peers));
    }

    updatePeers();
  }, []);

  const toggleTrack = useCallback(
    ({ trackId, endpointId }: { trackId: string; endpointId: string }) => {
      RNFishjamClientModule.toggleTrack({ trackId, endpointId });
    },
    [],
  );

  return { peers, toggleTrack };
}
