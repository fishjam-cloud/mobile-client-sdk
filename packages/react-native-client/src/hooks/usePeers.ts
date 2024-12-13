import { useMemo } from 'react';

import { Brand, GenericMetadata, TrackEncoding, TrackMetadata } from '../types';
import RNFishjamClientModule, {
  ReceivableEvents,
} from '../RNFishjamClientModule';
import { useFishjamEventState } from './internal/useFishjamEventState';

export type PeerId = Brand<string, 'PeerId'>;
export type TrackId = Brand<string, 'TrackId'>;

export type TrackType = 'Audio' | 'Video';

/**
 * Type describing Voice Activity Detection statuses.
 *
 * - `speech` voice activity has been detected
 * - `silence` - lack of voice activity has been detected
 */
export type VadStatus = 'silence' | 'speech';

export type PeerTrackMetadata<PeerMetadata, ServerMetadata> = {
  peer: PeerMetadata;
  server: ServerMetadata;
};

export type TrackBase = {
  id: TrackId;
  type: TrackType;
  isActive: boolean;
  metadata?: TrackMetadata;
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

export type DistinguishedTracks = {
  cameraTrack?: VideoTrack;
  microphoneTrack?: AudioTrack;
  screenShareVideoTrack?: VideoTrack;
  screenShareAudioTrack?: AudioTrack;
};

export type PeerWithTracks<
  PeerMetadata extends GenericMetadata = GenericMetadata,
  ServerMetadata extends GenericMetadata = GenericMetadata,
> = Peer<PeerMetadata, ServerMetadata> & DistinguishedTracks;

export type Peer<
  PeerMetadata extends GenericMetadata = GenericMetadata,
  ServerMetadata extends GenericMetadata = GenericMetadata,
> = {
  /**
   *  id used to identify a peer
   */
  id: PeerId;
  /**
   * whether the peer is local or remote
   */
  isLocal: boolean;
  /**
   * a type containing peer and server metadata
   */
  metadata: PeerTrackMetadata<PeerMetadata, ServerMetadata>;
  /**
   * a list of peer's video and audio tracks
   */
  tracks: Track[];
};

function addIsActiveToTracks<
  PeerMetadata extends GenericMetadata = GenericMetadata,
  ServerMetadata extends GenericMetadata = GenericMetadata,
>(
  peers: ReadonlyArray<Peer<PeerMetadata, ServerMetadata>>,
): Peer<PeerMetadata, ServerMetadata>[] {
  return peers.map((peer) => ({
    ...peer,
    tracks: peer.tracks.map((track) => ({
      ...track,
      isActive:
        (track as { metadata?: TrackMetadata })?.metadata?.active ?? true,
    })),
  }));
}

function getPeerWithDistinguishedTracks<
  PeerMetadata extends GenericMetadata = GenericMetadata,
  ServerMetadata extends GenericMetadata = GenericMetadata,
>(
  peer: Peer<PeerMetadata, ServerMetadata>,
): PeerWithTracks<PeerMetadata, ServerMetadata> {
  const { tracks: peerTracks } = peer;

  const distinguishedTracks: DistinguishedTracks = {};

  for (const track of peerTracks) {
    const trackType = track.metadata?.type;

    switch (trackType) {
      case 'camera':
        distinguishedTracks.cameraTrack = track as VideoTrack;
        break;
      case 'microphone':
        distinguishedTracks.microphoneTrack = track as AudioTrack;
        break;
      case 'screenShareVideo':
        distinguishedTracks.screenShareVideoTrack = track as VideoTrack;
        break;
      case 'screenShareAudio':
        distinguishedTracks.screenShareAudioTrack = track as AudioTrack;
        break;
    }
  }

  return {
    ...peer,
    ...distinguishedTracks,
  };
}

/**
 * Result type for the usePeers hook.
 * @template PeerMetadata - Type for peer-specific metadata
 * @template ServerMetadata - Type for server-specific metadata
 */
export type UsePeersResult<
  PeerMetadata extends GenericMetadata = GenericMetadata,
  ServerMetadata extends GenericMetadata = GenericMetadata,
> = {
  localPeer: PeerWithTracks<PeerMetadata, ServerMetadata> | null;

  remotePeers: PeerWithTracks<PeerMetadata, ServerMetadata>[];

  peers: Peer<PeerMetadata, ServerMetadata>[];
};

/**
 * Hook that provides live updates of room peers.
 * @template PeerMetadata - Type for peer-specific metadata
 * @template ServerMetadata - Type for server-specific metadata
 * @category Connection
 * @group Hooks
 */
export function usePeers<
  PeerMetadata extends GenericMetadata = GenericMetadata,
  ServerMetadata extends GenericMetadata = GenericMetadata,
>() {
  const peers = useFishjamEventState<Peer<PeerMetadata, ServerMetadata>[]>(
    ReceivableEvents.PeersUpdate,
    RNFishjamClientModule.getPeers<PeerMetadata, ServerMetadata>(),
    (peersWithoutActive) => addIsActiveToTracks(peersWithoutActive),
  );

  const localPeer = useMemo(() => {
    const localPeerData = peers.find((peer) => peer.isLocal);
    return localPeerData ? getPeerWithDistinguishedTracks(localPeerData) : null;
  }, [peers]);

  const remotePeers = useMemo(
    () =>
      peers.filter((peer) => !peer.isLocal).map(getPeerWithDistinguishedTracks),
    [peers],
  );

  return {
    /**
     * The local peer with distinguished tracks (camera, microphone, screen share).
     * Will be null if the local peer is not found.
     */
    localPeer,
    /**
     * Array of remote peers with distinguished tracks (camera, microphone, screen share).
     */
    remotePeers,
    /**
     * @deprecated Use localPeer and remotePeers instead
     * Legacy array containing all peers (both local and remote) without distinguished tracks.
     * This property will be removed in future versions.
     */
    peers,
  };
}
