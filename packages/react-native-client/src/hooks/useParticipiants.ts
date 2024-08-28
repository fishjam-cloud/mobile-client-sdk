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

export type Participiant<MetadataType extends Metadata> = {
  /**
   *  id used to identify a participiant
   */
  id: string;
  /**
   * whether the participiant is local or remote
   */
  isLocal: boolean;
  /**
   * a map `string -> any` containing participiant metadata from the server
   */
  metadata: MetadataType;
  /**
   * a list of participiants's video and audio tracks
   */
  tracks: Track[];
};

export type ParticipiantsUpdateEvent<MetadataType extends Metadata> = {
  PeersUpdate: Participiant<MetadataType>[];
};

function addIsActiveToTracks<MetadataType extends Metadata>(
  participiants: ReadonlyArray<Participiant<MetadataType>>,
): Participiant<MetadataType>[] {
  return participiants.map((participiant) => ({
    ...participiant,
    tracks: participiant.tracks.map((track) => ({
      ...track,
      isActive:
        (track as { metadata?: TrackMetadata })?.metadata?.active ?? true,
    })),
  }));
}
/**
 * This hook provides live updates of room participiants.
 * @returns An array of room participiants.
 */
export function useParticipiants<MetadataType extends Metadata>() {
  const [participiants, setParticipiants] = useState<
    Participiant<MetadataType>[]
  >([]);

  useEffect(() => {
    async function updateParticipiants() {
      const participiants =
        await RNFishjamClientModule.getPeers<MetadataType>();
      setParticipiants(addIsActiveToTracks(participiants));
    }

    const eventListener = eventEmitter.addListener<
      ParticipiantsUpdateEvent<MetadataType>
    >(ReceivableEvents.PeersUpdate, (event) => {
      setParticipiants(addIsActiveToTracks(event.PeersUpdate));
    });

    updateParticipiants();
    return () => eventListener.remove();
  }, []);

  return { participiants };
}
