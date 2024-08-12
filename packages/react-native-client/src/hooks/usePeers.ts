import { useEffect, useState } from 'react';

import { Metadata, SimulcastConfig, TrackEncoding } from '../types';
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

export type Track<MetadataType extends Metadata> = {
  id: string;
  type: TrackType;
  metadata: MetadataType;
  vadStatus: VadStatus;
  // Encoding that is currently received. Only present for remote tracks.
  encoding: TrackEncoding | null;
  // Information about simulcast, if null simulcast is not enabled
  simulcastConfig: SimulcastConfig | null;
  // The reason of currently selected encoding. Only present for remote tracks.
  encodingReason: EncodingReason | null;
};

/**
 * Type describing possible reasons of currently selected encoding.
 *
 * - other - the exact reason couldn't be determined
 * - encoding_inactive - previously selected encoding became inactive
 * - low_bandwidth - there is no longer enough bandwidth to maintain previously selected encoding
 */
export type EncodingReason = 'other' | 'encoding_inactive' | 'low_bandwidth';

export type PeersUpdateEvent<
  MetadataType extends Metadata,
  VideoTrackMetadataType extends Metadata,
  AudioTrackMetadataType extends Metadata,
> = {
  PeersUpdate: Peer<
    MetadataType,
    VideoTrackMetadataType,
    AudioTrackMetadataType
  >[];
};

export type Peer<
  MetadataType extends Metadata,
  VideoTrackMetadataType extends Metadata,
  AudioTrackMetadataType extends Metadata,
> = {
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
  tracks: Track<VideoTrackMetadataType | AudioTrackMetadataType>[];
};

/**
 * This hook provides live updates of room peers.
 * @returns An array of room peers.
 */
export function usePeers<
  MetadataType extends Metadata,
  VideoTrackMetadataType extends Metadata,
  AudioTrackMetadataType extends Metadata,
>() {
  const [peers, setPeers] = useState<
    Peer<MetadataType, VideoTrackMetadataType, AudioTrackMetadataType>[]
  >([]);

  useEffect(() => {
    async function updatePeers() {
      const peers = await RNFishjamClientModule.getPeers<
        MetadataType,
        VideoTrackMetadataType,
        AudioTrackMetadataType
      >();
      setPeers(peers);
    }

    const eventListener = eventEmitter.addListener<
      PeersUpdateEvent<
        MetadataType,
        VideoTrackMetadataType,
        AudioTrackMetadataType
      >
    >(ReceivableEvents.PeersUpdate, (event) => {
      setPeers(event.PeersUpdate);
    });

    updatePeers();
    return () => eventListener.remove();
  }, []);

  return { peers };
}
