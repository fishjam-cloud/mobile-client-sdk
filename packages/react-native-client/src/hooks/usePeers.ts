import { useEffect, useState } from 'react';

import { Metadata, TrackEncoding, TrackMetadata } from '../types';
import RNFishjamClientModule from '../RNFishjamClientModule';
import { ReceivableEvents, eventEmitter } from '../common/eventEmitter';

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

export type PeersUpdateEvent<MetadataType extends Metadata> = {
  PeersUpdate: Peer<MetadataType>[];
};

export type Peer<MetadataType extends Metadata> = {
  /**
   *  id used to identify a peer
   */
  id: string;
  /**
   * whether the peer is local or remote
   */
  isLocal: boolean;
  /**
   * a map `string -> any` containing peer metadata from the server
   */
  metadata: MetadataType;
  /**
   * a list of peers's video and audio tracks
   */
  tracks: Track[];
};

function addIsActiveToTracks<MetadataType extends Metadata>(
  peers: ReadonlyArray<Peer<MetadataType>>,
): Peer<MetadataType>[] {
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
 */
export function usePeers<MetadataType extends Metadata>() {
  const [peers, setPeers] = useState<Peer<MetadataType>[]>([]);

  useEffect(() => {
    async function updatePeers() {
      const peers = await RNFishjamClientModule.getPeers<MetadataType>();
      setPeers(addIsActiveToTracks(peers));
    }

    const eventListener = eventEmitter.addListener<
      PeersUpdateEvent<MetadataType>
    >(ReceivableEvents.PeersUpdate, (event) => {
      setPeers(addIsActiveToTracks(event.PeersUpdate));
    });

    updatePeers();
    return () => eventListener.remove();
  }, []);

  return { peers };
}
