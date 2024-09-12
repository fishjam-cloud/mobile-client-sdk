import { useCallback, useEffect, useState } from 'react';

import { GenericMetadata, TrackEncoding, TrackMetadata } from '../types';
import RNFishjamClientModule from '../RNFishjamClientModule';
import { ReceivableEvents } from '../common/eventEmitter';
import { useFishjamEvent } from './useFishjamEvent';

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

export type Participant<
  ParticipantMetadata extends GenericMetadata = GenericMetadata,
> = {
  /**
   *  id used to identify a participant
   */
  id: string;
  /**
   * whether the participant is local or remote
   */
  isLocal: boolean;
  /**
   * a map indexed by strings, containing participant metadata from the server
   */
  metadata: ParticipantMetadata;
  /**
   * a list of participants's video and audio tracks
   */
  tracks: Track[];
};

export type ParticipantsUpdateEvent<
  ParticipantMetadata extends GenericMetadata = GenericMetadata,
> = {
  PeersUpdate: Participant<ParticipantMetadata>[];
};

function addIsActiveToTracks<
  ParticipantMetadata extends GenericMetadata = GenericMetadata,
>(
  participants: ReadonlyArray<Participant<ParticipantMetadata>>,
): Participant<ParticipantMetadata>[] {
  return participants.map((participant) => ({
    ...participant,
    tracks: participant.tracks.map((track) => ({
      ...track,
      isActive:
        (track as { metadata?: TrackMetadata })?.metadata?.active ?? true,
    })),
  }));
}
/**
 * This hook provides live updates of room participants.
 * @returns An array of room participants.
 */
export function useParticipants<
  ParticipantMetadata extends GenericMetadata = GenericMetadata,
>() {
  const [participants, setParticipants] = useState<
    Participant<ParticipantMetadata>[]
  >([]);

  const updateActiveParticipants = useCallback(
    (participants: ParticipantsUpdateEvent<ParticipantMetadata>) => {
      setParticipants(
        addIsActiveToTracks<ParticipantMetadata>(participants.PeersUpdate),
      );
    },
    [],
  );

  useFishjamEvent<ParticipantsUpdateEvent<ParticipantMetadata>>(
    ReceivableEvents.PeersUpdate,
    updateActiveParticipants,
  );

  useEffect(() => {
    async function updateParticipants() {
      const participants =
        await RNFishjamClientModule.getPeers<ParticipantMetadata>();
      setParticipants(addIsActiveToTracks<ParticipantMetadata>(participants));
    }

    updateParticipants();
  }, []);

  return { participants };
}
